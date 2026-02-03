-- Xona egasi va adminlar xonani o'chira olishi uchun policy
CREATE POLICY "Room owners and admins can delete rooms"
ON public.rooms
FOR DELETE
USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin')
);

-- AI upgrade sozlamalari uchun jadval
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS yoqish
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Hammaga o'qish huquqi
CREATE POLICY "Anyone can view app settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Faqat adminlar o'zgartira oladi
CREATE POLICY "Admins can update app settings"
ON public.app_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert app settings"
ON public.app_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app settings"
ON public.app_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Default AI upgrade sozlamasi
INSERT INTO public.app_settings (key, value) 
VALUES ('ai_upgrade_enabled', '{"enabled": false, "message": "AI Pro versiyasiga yangilash"}'::jsonb);