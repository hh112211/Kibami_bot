-- Create important_dates table for tracking user's important dates
CREATE TABLE IF NOT EXISTS important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_value DATE NOT NULL,
  date_type TEXT CHECK (date_type IN ('birthday', 'anniversary', 'deadline', 'appointment', 'custom')),
  remind_before_days INT DEFAULT 1,
  is_recurring BOOLEAN DEFAULT FALSE,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_important_dates_user_id ON important_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_date_value ON important_dates(date_value);

-- Enable RLS
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON important_dates
  FOR ALL
  USING (true)
  WITH CHECK (true);
