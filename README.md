# AtomCamp — Smart Adaptive LMS

> Built for the **AUREX 26 AI Hackathon** · AI-powered learning management system that adapts to every student.

## Live Demo

**[https://atomcamp.duckdns.org](https://atomcamp.duckdns.org)** — deployed on AWS EC2

---

## What is this?

AtomCamp LMS is a production-grade, AI-native learning platform that personalises every student's journey from the moment they sign up — and gives instructors real-time intelligence to intervene before students fall behind.

The system uses **GPT-4o** to generate personalised learning paths, power a Socratic AI tutor, create domain-specific quizzes, and surface at-risk student insights. Resources are sourced live from the web via **Tavily Search API** so every learning path contains real, free, up-to-date materials.

---

## Features

### For Students
| Feature | Description |
|---|---|
| **AI Learning Path Generator** | 5-question onboarding diagnostic — GPT-4o builds a personalised topic sequence with real free resources sourced via Tavily |
| **Socratic AI Tutor** | Chat sidebar on every lesson — AtomBot guides with follow-up questions, never just answers |
| **Adaptive Quiz Engine** | Domain-specific MCQs generated per topic; below 60% triggers at-risk flag and personalised guidance |
| **AI Lesson Summariser** | One-click bullet-point key takeaways and quiz hints per lesson |
| **Progress Dashboard** | Streak tracker, activity heatmap, quiz history, and real-time path progress |
| **Instructor Subscriptions** | Subscribe to instructors — get notified when they publish quizzes, assignments, or videos |

### For Instructors
| Feature | Description |
|---|---|
| **Class Intelligence Dashboard** | Real subscriber data, quiz averages, risk scores, and last-active timestamps |
| **AI Progress Insights** | Plain-English class analysis: who is at risk, what concepts are hardest, what to do today |
| **AI Intervention Plans** | Per-student AI-generated outreach messages, action steps, and path adjustments |
| **AI Quiz Generator** | Paste any lesson content — exam-quality MCQs with distractors, answers, and explanations |
| **Content Publishing** | Publish quizzes, assignments, or videos — all subscribers are instantly notified |
| **Approval-Gated Access** | Instructors wait for admin approval before accessing the dashboard |

### For Admins
| Feature | Description |
|---|---|
| **Separate Admin Portal** | `/admin_entrance` — dedicated login with special credentials, completely separate from Supabase auth |
| **Instructor Approval Queue** | Filter pending / approved / rejected; approve or reject with one click |
| **Instant Effect** | Approved instructors can log in immediately; rejected instructors see a clear message |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router) |
| **Language** | TypeScript |
| **AI** | OpenAI GPT-4o via `openai` SDK |
| **Resource Search** | Tavily Search API |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security) |
| **Styling** | CSS-in-JS — Instrument Serif + JetBrains Mono |
| **Deployment** | Vercel-ready |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Tehman700/atomCamp_Hackathon.git
cd atomCamp_Hackathon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Tavily — real resource search per topic
TAVILY_API_KEY=tvly-...

# Supabase — Settings > API in your project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin portal
ADMIN_USERNAME=atomcamp_admin
ADMIN_PASSWORD=your-strong-password
ADMIN_SECRET=your-secret-token
```

### 4. Set up the Supabase database

Run these SQL statements in **Supabase SQL Editor** (Dashboard > SQL Editor > New query):

#### Profiles table + auto-create trigger

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  avatar_initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'student') = 'teacher'
      THEN 'pending'
      ELSE 'approved'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Learning paths

```sql
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  path_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Quiz results

```sql
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id TEXT,
  topic_title TEXT,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  answers JSONB,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Instructor subscriptions, content and notifications

```sql
CREATE TABLE IF NOT EXISTS public.instructor_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, instructor_id)
);

CREATE TABLE IF NOT EXISTS public.instructor_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instructor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('quiz', 'assignment', 'video')) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.instructor_content(id) ON DELETE CASCADE NOT NULL,
  instructor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Application Routes

### Public
| Route | Description |
|---|---|
| `/` | Landing page — features, CTAs, floating accent chips |
| `/signup` | Student or instructor account creation |
| `/login` | Sign in — routes to the correct dashboard based on role and status |

### Student (authenticated)
| Route | Description |
|---|---|
| `/onboarding` | 5-step diagnostic quiz to profile the learner |
| `/learning-path` | Personalised topic sequence with real Tavily resources |
| `/lesson/[id]` | Lesson viewer with AI tutor chat sidebar + lesson summariser |
| `/quiz/[id]` | Domain-specific adaptive quiz with full per-question results |
| `/dashboard` | Streak, heatmap, quiz history, notifications, path overview |
| `/instructors` | Browse approved instructors, subscribe / unsubscribe |

### Instructor (approved only)
| Route | Description |
|---|---|
| `/teacher` | Class dashboard — subscriber roster, AI insights, publish content |
| `/teacher/quiz-generator` | Paste lesson content — generate MCQs to export as JSON |
| `/pending-approval` | Waiting screen shown to instructors before admin approval |

### Admin (separate credentials)
| Route | Description |
|---|---|
| `/admin_entrance` | Admin login + instructor approval dashboard in one page |

---

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/generate-path` | POST | GPT-4o generates learning path; Tavily enriches topics with real resources |
| `/api/tutor` | POST | Streaming Socratic tutor response for lesson chat |
| `/api/quiz-for-topic` | POST | Generates domain-specific MCQs for a given topic |
| `/api/quiz-feedback` | POST | Per-answer AI feedback and overall recommendation |
| `/api/summarize-lesson` | POST | Bullet-point lesson summary and quiz hint |
| `/api/progress-insights` | POST | Plain-English class analysis for instructors |
| `/api/intervention` | POST | Per-student outreach message and action plan |
| `/api/generate-quiz` | POST | Instructor quiz generator from pasted content |
| `/api/save-quiz-result` | POST | Saves full quiz result with answer breakdown to Supabase |
| `/api/subscriptions` | GET / POST / DELETE | Student subscribe / unsubscribe to instructors |
| `/api/instructor/subscribers` | GET | Instructor fetches their real subscriber list with stats |
| `/api/instructor/publish` | POST | Publish content and notify all subscribers instantly |
| `/api/notifications` | GET / PATCH | Fetch and mark-read student notifications |
| `/api/admin/login` | POST / DELETE | Admin authentication — sets httpOnly cookie |
| `/api/admin/instructors` | GET / PATCH | List instructors, approve or reject by ID |

---

## How the AI Features Work

### Learning Path Generation
1. Student completes 5-question onboarding (background, goal, time available, programming level, domain interest)
2. GPT-4o generates a structured JSON topic sequence with a `searchQuery` per topic
3. Tavily searches each topic **in parallel** for real free resources (YouTube, Coursera, official docs, etc.)
4. Enriched path is saved to Supabase `learning_paths` table and displayed on `/learning-path`

### Socratic Tutor
- Each lesson has a persistent chat sidebar
- System prompt instructs the model to ask clarifying questions rather than just give the answer
- Streaming responses via OpenAI SDK for real-time feel

### Adaptive Quiz Engine
- Quiz URL uses the topic slug — e.g. `/quiz/python-basics`
- Questions are generated by GPT-4o specifically around that topic's content
- Results cached in `sessionStorage` to avoid re-generation on back-navigation
- After submission: per-question breakdown with your answer, correct answer, explanation, and AI recommendation
- All results saved to Supabase `quiz_results` with full answer array
- Score below 60% flags the student as at-risk in the instructor dashboard

### Instructor Notifications
- Students browse `/instructors` and subscribe to approved instructors with one click
- When an instructor publishes content, a `notifications` row is inserted for every subscriber simultaneously
- Students see an unread count badge on the dashboard and a clickable notification feed

---

## Design System

The UI follows an editorial paper-and-ink aesthetic — no dark purple gradients, no glassmorphism.

| Token | Value | Usage |
|---|---|---|
| Paper | `#f6f4ef` | Page backgrounds |
| Ink | `#0e0e12` | Primary text and borders |
| Blue | `#1710E6` | Primary actions, links, active states |
| Lime | `#8DC651` | Success, on-track, AI active badges |
| Warm grey | `#6b6458` | Secondary text and labels |
| Display font | Instrument Serif | Headings and large numbers |
| Mono font | JetBrains Mono | UI labels, code, body copy |

---

## Project Structure

```
atomcamp-lms/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── signup/                      # Account creation
│   ├── login/                       # Sign in
│   ├── onboarding/                  # 5-step learner diagnostic
│   ├── learning-path/               # Personalised topic list with resources
│   ├── lesson/[id]/                 # Lesson viewer + AI tutor sidebar
│   ├── quiz/[id]/                   # Adaptive domain-specific quiz
│   ├── dashboard/                   # Student dashboard + notifications
│   ├── instructors/                 # Browse and subscribe to instructors
│   ├── teacher/                     # Instructor dashboard
│   │   └── quiz-generator/          # AI quiz builder for instructors
│   ├── pending-approval/            # Instructor waiting screen
│   ├── admin_entrance/              # Admin login + approval panel
│   └── api/                         # All server-side API routes
├── components/
│   ├── TopBar.tsx                   # Fixed nav with live clock and username
│   ├── ProgressRing.tsx             # SVG progress ring component
│   └── AtomLogo.tsx                 # Brand mark
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                # Server Supabase client (SSR)
│   │   └── admin.ts                 # Service role client for admin ops
│   ├── openai.ts                    # OpenAI client singleton
│   └── data.ts                      # Static course and lesson seed data
├── middleware.ts                    # Auth routing guard
├── .env.example                     # Required environment variable template
└── supabase/schema.sql              # Database schema reference
```

---

## Deployment on Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` under **Settings > Environment Variables**
4. Deploy

Verify the build passes locally first:

```bash
npm run build
```

---

## Hackathon Context

Built for the **AUREX 26 AI Hackathon** under AtomCamp. The challenge: build a compelling AI-native application in a compressed timeframe.

This LMS demonstrates **six distinct AI integrations** working together in one coherent product:

- Personalised onboarding path generation with live resource enrichment
- Socratic AI lesson tutor with streaming responses
- Domain-specific adaptive quiz generation per topic
- Per-student AI intervention planning for instructors
- Real-time class intelligence dashboard
- Subscription-based instructor notification system

---

## License

MIT — free to fork, extend, and build on.

---

*AtomCamp LMS — Learn smarter, beautifully.*