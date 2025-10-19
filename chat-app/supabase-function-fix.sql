-- ============================================================================
-- Function Fix: get_rooms_with_metadata를 SECURITY DEFINER로 변경
-- ============================================================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS get_rooms_with_metadata();

-- SECURITY DEFINER로 재생성
CREATE OR REPLACE FUNCTION get_rooms_with_metadata()
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  description VARCHAR(200),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.name,
    cr.description,
    cr.created_by,
    cr.created_at,
    COUNT(DISTINCT rm.user_id) AS member_count,
    MAX(m.created_at) AS last_message_at
  FROM chat_rooms cr
  LEFT JOIN room_members rm ON cr.id = rm.room_id
  LEFT JOIN messages m ON cr.id = m.room_id AND m.deleted_at IS NULL
  GROUP BY cr.id, cr.name, cr.description, cr.created_by, cr.created_at
  ORDER BY last_message_at DESC NULLS LAST, cr.created_at DESC;
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.get_rooms_with_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rooms_with_metadata() TO anon;
