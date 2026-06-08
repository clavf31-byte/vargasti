
-- NOTES
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT DEFAULT '',
  content     TEXT DEFAULT '',
  category    TEXT DEFAULT 'Geral',
  tags        TEXT DEFAULT '',
  status      TEXT DEFAULT 'rascunho',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tags     TEXT DEFAULT '';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS status   TEXT DEFAULT 'rascunho';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notes' AND policyname='user_own_notes') THEN
    CREATE POLICY "user_own_notes" ON public.notes FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  description  TEXT DEFAULT '',
  status       TEXT DEFAULT 'ideia',
  category     TEXT DEFAULT '',
  technologies TEXT DEFAULT '',
  links        TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='user_own_projects') THEN
    CREATE POLICY "user_own_projects" ON public.projects FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- FILE_RECORDS
CREATE TABLE IF NOT EXISTS public.file_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  file_type    TEXT DEFAULT '',
  origin       TEXT DEFAULT '',
  size_bytes   BIGINT,
  storage_path TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_records TO authenticated;
GRANT ALL ON public.file_records TO service_role;
ALTER TABLE public.file_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='file_records' AND policyname='user_own_files') THEN
    CREATE POLICY "user_own_files" ON public.file_records FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
