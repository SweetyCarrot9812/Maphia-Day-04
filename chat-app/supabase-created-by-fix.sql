-- ============================================================================
-- Fix: chat_rooms.created_by 자동 채우기
-- ============================================================================

-- created_by 컬럼에 기본값 설정 (현재 인증된 사용자)
ALTER TABLE chat_rooms
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 기존 NULL 값들을 현재 사용자로 업데이트 (선택사항)
-- UPDATE chat_rooms SET created_by = auth.uid() WHERE created_by IS NULL;
