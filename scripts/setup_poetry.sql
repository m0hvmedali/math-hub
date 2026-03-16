-- Poetry Table
CREATE TABLE IF NOT EXISTS poems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    poet TEXT,
    era TEXT,
    category TEXT,
    verse_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Progress for Poetry (Spaced Repetition)
CREATE TABLE IF NOT EXISTS user_poem_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Simplified for local study_user name
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'new', -- new, learning, remembered
    next_review_date TIMESTAMPTZ DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT FALSE,
    last_reviewed_at TIMESTAMPTZ,
    UNIQUE(user_id, poem_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_poems_category ON poems(category);
CREATE INDEX IF NOT EXISTS idx_poems_era ON poems(era);
CREATE INDEX IF NOT EXISTS idx_user_poem_status ON user_poem_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_poem_review ON user_poem_progress(user_id, next_review_date);

-- Enable RLS
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_poem_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access" ON poems FOR SELECT USING (true);
CREATE POLICY "Users can manage their own poem progress" ON user_poem_progress
    FOR ALL USING (true); -- Simplified for this local-first app logic
