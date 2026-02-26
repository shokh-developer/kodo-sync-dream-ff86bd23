-- Kick should only remove user from the current room once.
-- It should not permanently block re-join like ban does.

-- room_members join policy: only ban should block join.
DROP POLICY IF EXISTS "Authenticated users can join if not banned or kicked" ON public.room_members;
CREATE POLICY "Authenticated users can join if not banned"
ON public.room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
);

-- chat insert policy: mute/ban should block chat, kick should not.
DROP POLICY IF EXISTS "Authenticated users can send messages if not restricted" ON public.chat_messages;
CREATE POLICY "Authenticated users can send messages if not muted or banned"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
  AND NOT public.is_user_banned(auth.uid(), room_id, 'mute')
);

-- file write policies: ban blocks writing, kick does not.
DROP POLICY IF EXISTS "Authenticated users can create files if not banned or kicked" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can update files if not banned or kicked" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can delete files if not banned or kicked" ON public.files;

CREATE POLICY "Authenticated users can create files if not banned"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
);

CREATE POLICY "Authenticated users can update files if not banned"
ON public.files
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
);

CREATE POLICY "Authenticated users can delete files if not banned"
ON public.files
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND NOT public.is_user_banned(auth.uid(), room_id, 'ban')
);
