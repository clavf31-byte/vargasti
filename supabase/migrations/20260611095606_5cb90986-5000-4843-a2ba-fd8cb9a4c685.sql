
DROP POLICY IF EXISTS "Authenticated users can manage articles" ON public.kb_articles;

-- Only admins can write. Falls back to denying writes if has_role/admin role is missing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'has_role') THEN
    EXECUTE $POL$
      CREATE POLICY "Admins can insert articles" ON public.kb_articles
      FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
    $POL$;
    EXECUTE $POL$
      CREATE POLICY "Admins can update articles" ON public.kb_articles
      FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
    $POL$;
    EXECUTE $POL$
      CREATE POLICY "Admins can delete articles" ON public.kb_articles
      FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
    $POL$;
  ELSE
    -- No role system present: restrict writes to service_role only (no policy = denied for authenticated).
    NULL;
  END IF;
END $$;
