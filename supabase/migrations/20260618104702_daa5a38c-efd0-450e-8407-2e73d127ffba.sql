
-- 1) profiles: restrict SELECT to owner (admins keep full access via separate policy)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) orcamento_approval_links: revoke token column read from regular users
REVOKE SELECT (token) ON public.orcamento_approval_links FROM authenticated;
REVOKE SELECT (token) ON public.orcamento_approval_links FROM anon;
REVOKE SELECT (token) ON public.orcamento_approval_links FROM PUBLIC;

-- 3) gmail_tokens: align user_id to uuid
DROP POLICY IF EXISTS "Users can manage their own gmail tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users manage own gmail tokens" ON public.gmail_tokens;

DELETE FROM public.gmail_tokens
WHERE user_id IS NULL
   OR user_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

ALTER TABLE public.gmail_tokens
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET NOT NULL;

CREATE POLICY "Users manage own gmail tokens"
  ON public.gmail_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
