-- Create magic_link_tokens table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  
  -- Index for faster token lookups
  INDEX idx_magic_link_tokens_token (token),
  
  -- Index for email-based queries
  INDEX idx_magic_link_tokens_email (email),
  
  -- Index for cleanup queries
  INDEX idx_magic_link_tokens_expires_at (expires_at)
);

-- Create a function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_magic_link_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM magic_link_tokens 
  WHERE expires_at < NOW() OR used = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate and mark token as used
CREATE OR REPLACE FUNCTION validate_magic_link_token(
  p_token TEXT,
  p_email TEXT
)
RETURNS TABLE (
  valid BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Check if token exists and is valid
  IF NOT EXISTS (
    SELECT 1 FROM magic_link_tokens 
    WHERE token = p_token 
    AND email = p_email 
    AND used = FALSE 
    AND expires_at > NOW()
  ) THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired magic link';
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE magic_link_tokens 
  SET used = TRUE 
  WHERE token = p_token;
  
  RETURN QUERY SELECT TRUE, 'Token validated successfully';
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public to insert new tokens (for magic link generation)
CREATE POLICY "Allow public to insert magic link tokens" ON magic_link_tokens
  FOR INSERT WITH CHECK (true);

-- Allow public to read tokens for validation (but only specific columns)
CREATE POLICY "Allow public to read magic link tokens" ON magic_link_tokens
  FOR SELECT USING (true);

-- Allow public to update tokens (mark as used)
CREATE POLICY "Allow public to update magic link tokens" ON magic_link_tokens
  FOR UPDATE USING (true);

-- Add a comment to the table
COMMENT ON TABLE magic_link_tokens IS 'Stores magic link authentication tokens for passwordless login';