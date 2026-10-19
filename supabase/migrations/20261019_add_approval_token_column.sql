-- Add approval_token column to orcamentos table if it doesn't exist
ALTER TABLE orcamentos
ADD COLUMN IF NOT EXISTS approval_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS orcamentos_approval_token_idx ON orcamentos(approval_token)
WHERE approval_token IS NOT NULL;
