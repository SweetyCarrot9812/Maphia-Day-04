-- ============================================================================
-- Supabase RLS Policy Fix
-- 403 Forbidden 에러 해결을 위한 추가 정책
-- ============================================================================

-- 1. chat_rooms 테이블 정책 추가
-- ============================================================================

-- SELECT 정책 (이미 있으면 재생성)
DROP POLICY IF EXISTS "chat_rooms_select_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_select_policy"
ON chat_rooms FOR SELECT
TO authenticated
USING (true);

-- INSERT 정책 (인증된 사용자만 채팅방 생성 가능)
DROP POLICY IF EXISTS "chat_rooms_insert_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_insert_policy"
ON chat_rooms FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE 정책 (방 만든 사람만 수정 가능)
DROP POLICY IF EXISTS "chat_rooms_update_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_update_policy"
ON chat_rooms FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- DELETE 정책 (방 만든 사람만 삭제 가능)
DROP POLICY IF EXISTS "chat_rooms_delete_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_delete_policy"
ON chat_rooms FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 2. room_members 테이블 정책 추가
-- ============================================================================

-- SELECT 정책 (자신이 속한 방의 멤버 목록만 조회 가능)
DROP POLICY IF EXISTS "room_members_select_policy" ON room_members;
CREATE POLICY "room_members_select_policy"
ON room_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = room_members.room_id
    AND rm.user_id = auth.uid()
  )
);

-- INSERT 정책 (자신을 멤버로 추가 가능)
DROP POLICY IF EXISTS "room_members_insert_policy" ON room_members;
CREATE POLICY "room_members_insert_policy"
ON room_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- DELETE 정책 (자신만 나갈 수 있음)
DROP POLICY IF EXISTS "room_members_delete_policy" ON room_members;
CREATE POLICY "room_members_delete_policy"
ON room_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3. messages 테이블 정책 확인 및 추가
-- ============================================================================

-- SELECT 정책 (자신이 속한 방의 메시지만 조회 가능)
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
CREATE POLICY "messages_select_policy"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = messages.room_id
    AND room_members.user_id = auth.uid()
  )
);

-- INSERT 정책 (자신이 속한 방에만 메시지 작성 가능)
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
CREATE POLICY "messages_insert_policy"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = messages.room_id
    AND room_members.user_id = auth.uid()
  )
);

-- UPDATE 정책 (자신의 메시지만 수정 가능 - soft delete 용)
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
CREATE POLICY "messages_update_policy"
ON messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE 정책 (자신의 메시지만 삭제 가능)
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
CREATE POLICY "messages_delete_policy"
ON messages FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 4. message_likes 테이블 정책 추가
-- ============================================================================

-- SELECT 정책 (자신이 속한 방의 메시지 좋아요만 조회)
DROP POLICY IF EXISTS "message_likes_select_policy" ON message_likes;
CREATE POLICY "message_likes_select_policy"
ON message_likes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN room_members rm ON m.room_id = rm.room_id
    WHERE m.id = message_likes.message_id
    AND rm.user_id = auth.uid()
  )
);

-- INSERT 정책 (자신의 좋아요만 추가 가능)
DROP POLICY IF EXISTS "message_likes_insert_policy" ON message_likes;
CREATE POLICY "message_likes_insert_policy"
ON message_likes FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM messages m
    JOIN room_members rm ON m.room_id = rm.room_id
    WHERE m.id = message_likes.message_id
    AND rm.user_id = auth.uid()
  )
);

-- DELETE 정책 (자신의 좋아요만 삭제 가능)
DROP POLICY IF EXISTS "message_likes_delete_policy" ON message_likes;
CREATE POLICY "message_likes_delete_policy"
ON message_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. user_profiles 테이블 정책 추가
-- ============================================================================

-- SELECT 정책 (모든 인증된 사용자가 프로필 조회 가능)
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
CREATE POLICY "user_profiles_select_policy"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- INSERT 정책 (자신의 프로필만 생성 가능)
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
CREATE POLICY "user_profiles_insert_policy"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE 정책 (자신의 프로필만 수정 가능)
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
CREATE POLICY "user_profiles_update_policy"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================================
-- Trigger 추가: 회원가입 시 user_profiles 자동 생성
-- ============================================================================

-- Trigger 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now(),
    now()
  );
  RETURN new;
END;
$$;

-- 기존 Trigger 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 정책 적용 확인
-- ============================================================================

-- 모든 테이블에 RLS 활성화 (이미 되어있으면 무시됨)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 완료
-- ============================================================================

-- 적용 확인 쿼리 (선택사항)
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
