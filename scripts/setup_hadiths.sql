-- SQL for Hadith System

-- Drop existing tables if they exist (careful with this in production, but here we are starting fresh as requested)
DROP TABLE IF EXISTS user_hadith_progress;
DROP TABLE IF EXISTS hadiths;

-- 1. Hadiths Table
CREATE TABLE hadiths (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id integer NOT NULL,
    book_id integer NOT NULL,
    chapter_id integer NOT NULL,
    text_ar text NOT NULL,
    text_en text,
    narrator_en text,
    book_name_ar text,
    book_name_en text,
    chapter_name_ar text,
    chapter_name_en text,
    category text DEFAULT 'General', -- Focus, Discipline, Knowledge, Life, Patience, Achievement
    created_at timestamp with time zone DEFAULT now()
);

-- Indexing for performance
CREATE INDEX idx_hadiths_book_chapter ON hadiths(book_id, chapter_id);
CREATE INDEX idx_hadiths_category ON hadiths(category);

-- 2. User Progress Table
CREATE TABLE user_hadith_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    hadith_id uuid REFERENCES hadiths(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'new', -- new, learning, remembered
    is_favorite boolean DEFAULT false,
    next_review_date timestamp with time zone DEFAULT now(),
    last_shown_date timestamp with time zone,
    show_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, hadith_id)
);

-- RLS Policies
ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on hadiths" ON hadiths FOR SELECT USING (true);
CREATE POLICY "Allow all on hadiths for admin" ON hadiths FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_hadith_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on user_hadith_progress" ON user_hadith_progress FOR ALL USING (true) WITH CHECK (true);
