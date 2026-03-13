

export type ContentType = 'markdown' | 'image' | 'audio' | 'video' | 'pdf' | 'google-drive' | 'whiteboard' | 'notebooklm' | 'flashcard' | 'quiz' | 'link' | 'podcast' | 'html-code' | 'raw-html' | 'timetable' | 'carousel' | 'google-docs' | 'google-slides' | 'google-sites' | 'rich-text';

export interface ContentBlock {
  id: string;
  type: ContentType;
  content: string;
  fileName?: string;
  front?: string;
  back?: string;
  color?: string; // Legacy Tailwind class support
  customColor?: string; // Hex/RGB for free color selection
  question?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  url?: string; // For direct links
  htmlContent?: string; // For html-code type
  cssContent?: string; // For html-code type
  jsContent?: string; // For html-code type
  timetableData?: any; // For timetable type
  images?: string[]; // For carousel type
  title?: string; // For carousel type
  whiteboardData?: string; // For whiteboard type (Excalidraw JSON)
  richTextData?: string; // For rich-text type (Tiptap JSON or HTML)

  // Intelligent Flashcard Stats (Spaced Repetition)
  flashcardStats?: {
    reps: number;           // Number of consecutive correct answers
    interval: number;       // Interval in days until next review
    easeFactor: number;     // Difficulty multiplier (starts at 2.5)
    nextReviewDate: string; // ISO Date string
    masteryLevel: 'new' | 'learning' | 'review' | 'mastered';
    lastGrade?: number;     // 0-5 grade from last review
  };
}

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Importance = 'low' | 'medium' | 'high';
export type UnderstandingLevel = 'weak' | 'average' | 'strong';

export interface Lesson {
  id: string;
  branch_id: string;
  name: string;
  content: ContentBlock[];
  status: LessonStatus;
  difficulty: Difficulty;
  importance: Importance;
  understanding_level: UnderstandingLevel;
  next_review_date?: string;
  review_stage: number;
  estimated_time_minutes?: number;
  tags?: string[]; // Mandatory for Architect (Supervisor)
}

export interface CourseBranch {
  id: string;
  subject_id: string;
  name: string;
  is_capsule?: boolean;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  user_id?: string;
  branches: CourseBranch[];
  created_at?: string;
  exam_date?: string;
  themeColor?: string;        // Primary color for this subject
  gradientStart?: string;      // Gradient start color
  gradientEnd?: string;        // Gradient end color
}

export interface StudySession {
  id: string;
  user_id: string;
  duration_minutes: number;
  focus_score: number;
  session_date: string;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
  status: 'pending' | 'completed';
  priority: Importance;
}

export interface ParticipantData {
  user_id: string;
  progress_minutes: number;
  secret_message: string;
  status: 'active' | 'inactive' | 'sleeping';
  acceptance_status: 'pending' | 'accepted' | 'declined'; // New
  last_activity: string;
}

export interface Competition {
  id: string;
  creator_id: string;
  participant_ids: string[];
  participant_data: Record<string, ParticipantData>;
  goal_minutes: number; // Used if target_type is 'time'
  target_type: 'time' | 'task'; // New
  target_task_id?: string; // New
  bet_description?: string;
  status: 'pending' | 'active' | 'finished'; // Added 'pending'
  start_time?: string; // New: ISO string for sync
  winner_id?: string;
  created_at: string;
}

export interface CrashTask {
  id: string;
  user_id: string;
  subject_id: string;
  exam_date: string;
  content: string;
  created_at: string;
}

export type ErrorCause = 'arithmetic_haste' | 'rule_misunderstanding' | 'unit_forgetting' | 'mental_distraction';

export interface KnowledgeError {
  id: string;
  user_id: string;
  lesson_id: string;
  cause: ErrorCause;
  socratic_question?: string;
  student_answer?: string;
  created_at: string;
}

export interface CustomNode {
  id: string;
  user_id: string;
  subject_id: string;
  label: string;
  url: string;
  x?: number;
  y?: number;
  tags?: string[];
  created_at: string;
}

export interface ManualLink {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  created_at: string;
}

// AI Analysis Types
export type GradeLevel = 'Secondary 1' | 'Secondary 2' | 'Secondary 3';

export interface WeeklySchedule {
  [day: string]: string[]; // e.g. "Monday": ["Math", "Physics"]
}

export interface MotivationalMessage {
  text: string;
  source: string;
  category: 'religious' | 'scientific' | 'philosophical' | 'wisdom';
}

export interface AnalysisResponse {
  summary: {
    accomplishment: string;
    effortType: 'mental' | 'emotional' | 'physical';
    stressLevel: 'low' | 'medium' | 'high';
    analysisText: string;
  };
  webAnalysis?: {
    rootCause: string;
    suggestedRemedy: string;
    sources: Array<{ title: string; url: string; snippet: string }>;
  };
  motivationalMessage?: MotivationalMessage;
  researchConnections: Array<{
    point: string;
    source: string;
    evidenceStrength: 'strong' | 'medium' | 'limited';
    type: 'causal' | 'correlational';
    relevance: string;
  }>;
  tomorrowPlan: Array<{
    time: string;
    task: string;
    method: string;
    type: 'study' | 'break' | 'sleep' | 'prayer';
  }>;
  recommendedMethods: Array<{
    subject: string;
    methodName: string;
    details: string;
    tools: string[];
  }>;
  psychologicalSupport: {
    message: string;
    technique: string;
  };
  quranicLink: {
    verse: string;
    surah: string;
    behavioralExplanation: string;
  };
  balanceScore: number;
}

export interface VoiceTutorResponse {
  score: number;
  feedback: string;
  missingConcepts: string[];
  correction: string;
}

export type AiStructuredResponse = {
  understanding_score: number;
  mistakes: string[];
  missing_points: string[];
  simplified_explanation: string;
  probing_questions: string[];
  study_plan: Array<{
    title: string;
    duration_minutes: number;
    why: string;
    when_suggestion?: string;
    tasks?: string[];
  }>;
  next_step_suggestion?: string;
  raw_md?: string;
};

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  data: {
    [blockId: string]: {
      selectedOption?: number;
      isCorrect?: boolean;
      attempts?: number;
      lastInteraction?: string;
    };
  };
  score: number;
  completed_at?: string;
  updated_at: string;
}

export interface TimelineItem {
  id: string;
  user_id: string;
  type: string;
  content: string;
  timestamp: string;
  status?: string;
}
