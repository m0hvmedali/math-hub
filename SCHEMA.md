# Database Schema (Supabase)

## [NEW] knowledge_errors
Stores student mistakes categorized by cause for pattern analysis and Socratic guidance.

```sql
CREATE TABLE knowledge_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  cause text NOT NULL, -- arithmetic_haste, rule_misunderstanding, unit_forgetting, mental_distraction
  socratic_question text,
  student_answer text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE knowledge_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on knowledge_errors" ON knowledge_errors FOR ALL USING (true) WITH CHECK (true);
```

## [NEW] custom_nodes
Stores manually injected resources and their spatial coordinates in the Cosmic Graph.

```sql
CREATE TABLE custom_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  x float,
  y float,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE custom_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on custom_nodes" ON custom_nodes FOR ALL USING (true) WITH CHECK (true);
```

## Existing Tables (Summary)
- **subjects**: Core subject planets.
- **branches**: Subject moon orbits.
- **lessons**: Individual knowledge stars. Includes `tags` column for Architect categorization.
- **tasks**: Student to-do items.
- **study_sessions**: Focus and time tracking data.
- **wishes**: Student aspirations and rewards.
- **crash_tasks**: Fast-track exam preparation items.