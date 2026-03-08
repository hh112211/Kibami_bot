-- Create users table for storing Telegram user profiles and preferences
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  display_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  personality_type TEXT CHECK (personality_type IN ('friendly', 'professional', 'funny', 'caring', 'direct')),
  preferred_treat TEXT CHECK (preferred_treat IN ('formal', 'casual', 'playful')),
  work_hours_start TIME,
  work_hours_end TIME,
  timezone TEXT DEFAULT 'Asia/Yangon',
  language_preference TEXT DEFAULT 'auto',
  onboarding_step TEXT DEFAULT 'start',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster Telegram ID lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for bot operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
