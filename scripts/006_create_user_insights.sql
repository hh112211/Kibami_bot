-- Create user_insights table for AI extracted insights about user
CREATE TABLE IF NOT EXISTS user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT CHECK (insight_type IN ('person', 'situation', 'preference', 'concern', 'goal')),
  title TEXT NOT NULL,
  details TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  last_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  mention_count INT DEFAULT 1
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_type ON user_insights(insight_type);

-- Enable RLS
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON user_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);
