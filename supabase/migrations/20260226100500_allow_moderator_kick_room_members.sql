-- Allow admins and moderators to remove room members (needed for Kick action).

DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;

CREATE POLICY "Users can leave rooms and moderators can remove members"
ON public.room_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);
