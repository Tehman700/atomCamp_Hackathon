-- AtomCamp Smart LMS — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- 1. Profiles (extends auth.users with role + display info)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Learning Paths (AI-generated, one per user)
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_profile JSONB NOT NULL DEFAULT '{}',
  path_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Chat History (tutor conversations per user + lesson)
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 4. Quiz Results (one row per quiz attempt)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  recommendation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Lesson Summaries (cached AI summaries — no re-generation needed)
CREATE TABLE IF NOT EXISTS public.lesson_summaries (
  lesson_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Generated Quizzes (teacher-generated question banks)
CREATE TABLE IF NOT EXISTS public.generated_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT,
  title TEXT NOT NULL,
  source_content TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_quizzes ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own; teachers/admins see all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Learning paths: own only
CREATE POLICY "Users own their learning paths" ON public.learning_paths
  FOR ALL USING (auth.uid() = user_id);

-- Chat history: own only
CREATE POLICY "Users own their chat history" ON public.chat_history
  FOR ALL USING (auth.uid() = user_id);

-- Quiz results: students see own; teachers see all (simplified for MVP)
CREATE POLICY "Students see own results" ON public.quiz_results
  FOR ALL USING (auth.uid() = user_id);

-- Lesson summaries: everyone can read
CREATE POLICY "Anyone can read summaries" ON public.lesson_summaries
  FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert summaries" ON public.lesson_summaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Generated quizzes: teachers see own
CREATE POLICY "Teachers see own quizzes" ON public.generated_quizzes
  FOR ALL USING (auth.uid() = teacher_id);

-- TRIGGER: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', 'U'), 2))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
