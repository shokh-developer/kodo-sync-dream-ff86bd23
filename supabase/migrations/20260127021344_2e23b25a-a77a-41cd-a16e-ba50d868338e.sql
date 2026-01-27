-- Add created_by column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create room_members table to track who joined rooms
CREATE TABLE IF NOT EXISTS public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Policies for room_members
CREATE POLICY "Users can view their own memberships"
ON public.room_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can join rooms"
ON public.room_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.room_members
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for room_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;