ALTER TABLE public.email_settings 
ADD COLUMN IF NOT EXISTS blacklist JSONB NOT NULL DEFAULT '[]';

CREATE OR REPLACE FUNCTION public.save_email_settings(
  p_categories JSONB DEFAULT NULL,
  p_whitelist JSONB DEFAULT NULL,
  p_priorities JSONB DEFAULT NULL,
  p_blacklist JSONB DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_singleton_id UUID := '00000000-0000-0000-0000-000000000000';
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.email_settings WHERE id = v_singleton_id) INTO v_exists;
  IF v_exists THEN
    UPDATE public.email_settings SET
      categories = COALESCE(p_categories, categories),
      whitelist  = COALESCE(p_whitelist,  whitelist),
      priorities = COALESCE(p_priorities, priorities),
      blacklist  = COALESCE(p_blacklist,  blacklist),
      updated_at = now()
    WHERE id = v_singleton_id;
    RETURN QUERY SELECT true, 'Settings saved'::TEXT;
  ELSE
    INSERT INTO public.email_settings (id, categories, whitelist, priorities, blacklist)
    VALUES (v_singleton_id,
      COALESCE(p_categories, '[]'::JSONB),
      COALESCE(p_whitelist,  '[]'::JSONB),
      COALESCE(p_priorities, '[]'::JSONB),
      COALESCE(p_blacklist,  '[]'::JSONB));
    RETURN QUERY SELECT true, 'Settings created'::TEXT;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.load_email_settings()
RETURNS TABLE (categories JSONB, whitelist JSONB, priorities JSONB, blacklist JSONB)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT es.categories, es.whitelist, es.priorities, es.blacklist
  FROM public.email_settings es
  WHERE es.id = '00000000-0000-0000-0000-000000000000';
END;
$$;