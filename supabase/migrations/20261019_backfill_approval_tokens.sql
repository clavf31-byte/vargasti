-- Backfill approval_token for orcamentos that don't have one yet
UPDATE public.orcamentos
SET approval_token = encode(gen_random_bytes(32), 'hex'),
    approval_status = 'pending'
WHERE approval_token IS NULL
  AND id IS NOT NULL;
