-- Foydalanuvchilar uchun AI ruxsatnomasi jadvali
CREATE TABLE public.user_ai_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  ai_enabled boolean NOT NULL DEFAULT true,
  disabled_by uuid,
  disabled_at timestamp with time zone,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS yoqish
ALTER TABLE public.user_ai_access ENABLE ROW LEVEL SECURITY;

-- Hammaga o'qish huquqi (AI ishlashini tekshirish uchun)
CREATE POLICY "Anyone can view AI access"
ON public.user_ai_access
FOR SELECT
USING (true);

-- Adminlar boshqara oladi
CREATE POLICY "Admins can manage AI access"
ON public.user_ai_access
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));