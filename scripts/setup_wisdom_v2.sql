-- Unified Wisdom System v2
-- This table combines Hadiths, Poetry, and Scholar Quotes

CREATE TABLE IF NOT EXISTS wisdom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    author TEXT,
    source TEXT, -- e.g. "Bukhari", "Al-Mutanabbi", "Hasan al-Basri"
    category TEXT, -- e.g. "Patience", "Knowledge", "Love", "Wisdom"
    type TEXT NOT NULL, -- "hadith", "poetry", "scholar_quote", "general_wisdom"
    is_golden BOOLEAN DEFAULT FALSE, -- 1% of items
    metadata JSONB, -- store extra info like verse_count, chapter_id etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking History to prevent repetition
CREATE TABLE IF NOT EXISTS user_wisdom_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    item_id UUID REFERENCES wisdom_items(id) ON DELETE CASCADE,
    shown_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spaced Repetition Progress
CREATE TABLE IF NOT EXISTS user_wisdom_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    item_id UUID REFERENCES wisdom_items(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'new', -- new, learning, remembered
    next_review_date TIMESTAMPTZ DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT FALSE,
    show_count INTEGER DEFAULT 0,
    last_shown_at TIMESTAMPTZ,
    UNIQUE(user_id, item_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_wisdom_type ON wisdom_items(type);
CREATE INDEX IF NOT EXISTS idx_wisdom_golden ON wisdom_items(is_golden) WHERE is_golden = TRUE;
CREATE INDEX IF NOT EXISTS idx_wisdom_history_user ON user_wisdom_history(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_progress_review ON user_wisdom_progress(user_id, next_review_date);

-- Enable RLS
ALTER TABLE wisdom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wisdom_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wisdom_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Wisdom Read" ON wisdom_items FOR SELECT USING (true);
CREATE POLICY "User Manage History" ON user_wisdom_history FOR ALL USING (true);
CREATE POLICY "User Manage Progress" ON user_wisdom_progress FOR ALL USING (true);

-- Functions for random selection excluding history
-- We'll mostly handle this in the hook for flexibility, but indexes help.
