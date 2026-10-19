-- Add approval_token and approval_status columns to orcamentos table
ALTER TABLE IF EXISTS orcamentos ADD COLUMN IF NOT EXISTS approval_token TEXT UNIQUE;
ALTER TABLE IF EXISTS orcamentos ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS orcamentos_approval_token_idx ON orcamentos(approval_token)
WHERE approval_token IS NOT NULL;
