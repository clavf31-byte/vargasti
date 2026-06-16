-- email_settings: replace permissive policies with admin-only
DROP POLICY IF EXISTS "Authenticated users can read email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Authenticated users can insert email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Authenticated users can update email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.email_settings;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.email_settings;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.email_settings;

CREATE POLICY "Admins can view email settings"
  ON public.email_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email settings"
  ON public.email_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email settings"
  ON public.email_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email settings"
  ON public.email_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- email_processing_log: admin read access; writes remain service-role only
CREATE POLICY "Admins can view email processing log"
  ON public.email_processing_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));