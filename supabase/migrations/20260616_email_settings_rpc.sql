-- Função RPC para salvar configurações de email (com permissões elevadas)
CREATE OR REPLACE FUNCTION public.save_email_settings(
  p_categories JSONB DEFAULT NULL,
  p_whitelist JSONB DEFAULT NULL,
  p_priorities JSONB DEFAULT NULL,
  p_blacklist JSONB DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_singleton_id UUID := '00000000-0000-0000-0000-000000000000';
  v_exists BOOLEAN;
BEGIN
  -- Verifica se o singleton existe
  SELECT EXISTS(SELECT 1 FROM public.email_settings WHERE id = v_singleton_id)
  INTO v_exists;

  IF v_exists THEN
    -- Atualiza apenas os campos fornecidos (não NULL)
    UPDATE public.email_settings
    SET
      categories = COALESCE(p_categories, categories),
      whitelist = COALESCE(p_whitelist, whitelist),
      priorities = COALESCE(p_priorities, priorities),
      blacklist = COALESCE(p_blacklist, blacklist),
      updated_at = now()
    WHERE id = v_singleton_id;

    RETURN QUERY SELECT true, 'Settings saved successfully'::TEXT;
  ELSE
    -- Cria o singleton
    INSERT INTO public.email_settings (id, categories, whitelist, priorities, blacklist)
    VALUES (
      v_singleton_id,
      COALESCE(p_categories, '[]'::JSONB),
      COALESCE(p_whitelist, '[]'::JSONB),
      COALESCE(p_priorities, '[]'::JSONB),
      COALESCE(p_blacklist, '[]'::JSONB)
    );

    RETURN QUERY SELECT true, 'Settings created and saved'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função RPC para carregar configurações
CREATE OR REPLACE FUNCTION public.load_email_settings()
RETURNS TABLE (categories JSONB, whitelist JSONB, priorities JSONB, blacklist JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT
    es.categories,
    es.whitelist,
    es.priorities,
    es.blacklist
  FROM public.email_settings es
  WHERE es.id = '00000000-0000-0000-0000-000000000000';
END;
$$ LANGUAGE plpgsql;

-- Garante que pelo menos um registro singleton existe
INSERT INTO public.email_settings (id, categories, whitelist, priorities, blacklist)
VALUES ('00000000-0000-0000-0000-000000000000', '[]', '[]', '[]', '[]')
ON CONFLICT (id) DO NOTHING;
