-- Create telegram_codes table for linking accounts
CREATE TABLE public.telegram_codes (
    code TEXT NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for telegram_codes
ALTER TABLE public.telegram_codes ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own codes
CREATE POLICY "Users can create their own codes"
ON public.telegram_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own codes (optional, for UI confirmation)
CREATE POLICY "Users can view their own codes"
ON public.telegram_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Update profiles table to store Telegram info
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT;
