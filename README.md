# QuizMania

### A Reusable Quiz Management Platform by Rotaract Club of Mapusa
*Rotary International District 3170*

**QuizMania** is a modern, event-ready, reusable quiz management platform designed for conducting engaging interactive competitions, fellowship challenges, and educational events.

---

## 🎨 Visual Identity & Brand Design Tokens

The visual design is inspired by the **Rotaract Club of Mapusa** branding reference:

| Token | Name | Hex Code | Purpose |
|---|---|---|---|
| `--qm-primary` | Deep Burgundy / Wine | `#6E123D` | Primary headers, brand anchors |
| `--qm-secondary` | Rich Magenta | `#A50D52` | Key buttons, gradients, highlights |
| `--qm-accent` | Bright Pink Accent | `#D83B70` | Badges, interactive states, icons |
| `--qm-blush` | Soft Blush | `#F3D6E1` | Pill tags, tinted surface backdrops |
| `--qm-background` | Off White | `#FAF8F9` | Clean, premium canvas |
| `--qm-text` | Dark Text | `#24141C` | High contrast, accessible typography |
| `--qm-border` | Rose Gray | `#F0E1E8` | Delicate structural card borders |

---

## 🏛️ System Architecture

QuizMania is organized as a clean npm monorepo with strict architectural separation between private admin and public participant interfaces:

```
quizmania/
├── apps/
│   ├── admin/                    # Private Local Admin Application (:3011)
│   │   ├── src/app/              # Next.js App Router (Dashboard, Quizzes, Themes, Media, Results)
│   │   ├── src/components/       # QuizEditor, QuestionEditor, OptionEditor, ThemeEditor, Importer
│   │   └── public/branding/      # Rotaract Club of Mapusa brand assets
│   └── public/                   # Public Quiz Application (:3010)
│       ├── src/app/              # Next.js App Router (Landing, /quizzes, /q/[slug], /api/submit)
│       ├── src/components/       # Hero, QuizCard, About, HowItWorks, RotaractSection, QuizRunner
│       └── public/branding/      # Rotaract Club of Mapusa brand assets
├── packages/
│   ├── types/                    # Core TypeScript interfaces (Quiz, Question, Option, Theme, Submission)
│   ├── quiz-schema/              # Zod schemas, JSON import/export validation & formatting
│   └── shared/                   # Public DAL, Admin DAL, Server-side Scoring Engine, Supabase clients
└── supabase/
    └── migrations/               # PostgreSQL schema, RLS policies, Security Definer RPC, Storage buckets
```

---

## 🔒 Security & Data Isolation Model

1. **Zero Client-Side Correct Answers**: The public quiz frontend and its Data Access Layer (`getPublishedQuizBySlug`) **never** receive `is_correct`, correct answers, or private metadata.
2. **Server-Side Scoring Engine**: Participant answers are evaluated exclusively server-side via `POST /api/quizzes/[slug]/submit` or the PostgreSQL `submit_quiz_answers` stored procedure (`SECURITY DEFINER`).
3. **Row Level Security (RLS)**: Public anonymous users are restricted from viewing draft quizzes, reading `options.is_correct`, or inspecting other participants' submissions.
4. **Standalone Private Admin**: Designed to execute in a local environment (`localhost:3011`) with administrative privileges, keeping admin routes unexposed to public participants.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v22)
- **npm**: v10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Both Applications Concurrently
```bash
npm run dev
```

Or start each app individually:
```bash
# Start Private Admin Studio (Port 3011)
npm run dev:admin

# Start Public Quiz Experience (Port 3010)
npm run dev:public
```

### 4. Build Monorepo
```bash
npm run build
```

---

## 🌐 Local URLs

| Application | URL | Description |
|---|---|---|
| **Public Landing Page** | [http://localhost:3010](http://localhost:3010) | Main QuizMania landing page with Hero, Featured Quizzes, and Rotaract section |
| **Public Quiz Directory** | [http://localhost:3010/quizzes](http://localhost:3010/quizzes) | Directory of all published quizzes |
| **Sample Public Quiz** | [http://localhost:3010/q/rotaract-youth-bowl-2026](http://localhost:3010/q/rotaract-youth-bowl-2026) | Live quiz runner for Rotaract Youth Knowledge Bowl 2026 |
| **Sample Nutrition Quiz** | [http://localhost:3010/q/nutrition-week-2026](http://localhost:3010/q/nutrition-week-2026) | Live quiz runner for Nutrition Week 2026 |
| **Admin Studio Dashboard** | [http://localhost:3011](http://localhost:3011) | Private local admin metrics, quick actions, and recent quizzes |
| **Admin Quiz Builder** | [http://localhost:3011/quizzes/create](http://localhost:3011/quizzes/create) | Quiz metadata, questions, marks, options, and live preview |
| **Admin Theme Designer** | [http://localhost:3011/themes](http://localhost:3011/themes) | Dynamic CSS variables theme manager and preview |
| **Admin JSON Importer** | [http://localhost:3011/quizzes?tab=import](http://localhost:3011/quizzes?tab=import) | Validates and imports quiz JSON with Zod error handling |

---

## 🗄️ Database & Supabase Setup

When ready to connect to a live Supabase project:

1. Copy `.env.example` to `.env.local` in `apps/admin` and `apps/public`.
2. Fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret>
   ```
3. Run the initial migration in your Supabase SQL Editor:
   ```
   supabase/migrations/20260904000001_initial_quiz_schema.sql
   ```
   This automatically provisions:
   - Tables: `themes`, `quizzes`, `questions`, `options`, `submissions`, `answers`
   - Row Level Security policies
   - Storage Buckets: `quiz-covers`, `question-images`, `option-images`, `branding-assets`
   - Default themes (including QuizMania Signature) & Seed Quizzes

*Note: In the absence of live Supabase credentials, the platform automatically switches to an in-memory fallback store so every screen and flow is fully testable immediately.*

---

## 📋 Recommended Next Development Step

**Phase 2: Functional Admin Quiz Builder + Supabase Connection**
1. Implement full interactive state persistence between the Admin Builder and Supabase.
2. Complete drag-and-drop question ordering and option reordering.
3. Wire live storage bucket file uploads for quiz covers and question diagrams.
