-- Enforce moderation actions (ban/mute/kick) at RLS level.

-- 1) Room creation: globally banned users cannot create rooms.
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
CREATE POLICY "Authenticated non-banned users can create rooms"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_bans ub
    WHERE ub.user_id = auth.uid()
      AND ub.ban_type = 'ban'
      AND ub.room_id IS NULL
      AND (ub.expires_at IS NULL OR ub.expires_at > now())
  )
);

-- 2) Room join: banned/kicked users cannot join.
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_members;
CREATE POLICY "Authenticated users can join if not banned or kicked"
ON public.room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'kick')
);

-- 3) Chat: muted/banned/kicked users cannot send messages.
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can send messages if not restricted"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'kick')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'mute')
);

-- 4) File write access: banned/kicked users cannot write files in a room.
DROP POLICY IF EXISTS "Anyone can create files" ON public.files;
DROP POLICY IF EXISTS "Anyone can update files" ON public.files;
DROP POLICY IF EXISTS "Anyone can delete files" ON public.files;

CREATE POLICY "Authenticated users can create files if not banned or kicked"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'kick')
);

CREATE POLICY "Authenticated users can update files if not banned or kicked"
ON public.files
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'kick')
);

CREATE POLICY "Authenticated users can delete files if not banned or kicked"
ON public.files
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'kick')
);
