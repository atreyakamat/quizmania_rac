# QuizMania

### A Flexible Quiz Creation & Participation Platform by Rotaract Club of Mapusa
*Rotary International District 3170 | Built by Atreya Kamat*

**QuizMania** is a production-grade, event-ready quiz management platform comparable in core functionality to Google Forms Quiz. It is a Next.js monorepo with a private Admin Studio and a public participant-facing quiz application.

---

## 🏗️ Architecture Overview

```
quizmania/
├── apps/
│   ├── admin/          # Private Admin Studio (port 3011) — NEVER deploy publicly
│   └── public/         # Public Quiz App (port 3010) — quizmania.atreyakamat.dev
├── packages/
│   ├── types/          # Shared TypeScript interfaces (@quizmania/types)
│   ├── quiz-schema/    # Zod validation schemas (@quizmania/quiz-schema)
│   └── shared/         # DAL, scoring engine, supabase client, theme utils (@quizmania/shared)
└── supabase/
    └── migrations/     # Ordered SQL migration files
```

### Supabase Database Schema

| Table | Purpose |
|---|---|
| `quizzes` | Quiz metadata, settings, status |
| `questions` | Questions with type, marks, scoring config |
| `options` | Multiple-choice options with correct-answer flag |
| `sections` | Optional quiz sections/groups |
| `themes` | Visual theme configuration |
| `quiz_attempts` | Session tracking per participant |
| `submissions` | Final submission records with score |
| `answers` | Per-question answer records |

---

## ✨ Feature Set

### Quiz Builder (Admin)
- Multi-step quiz editor: Details → Settings → Questions → Theme
- **5 question types**: Single Choice, Multiple Choice, True/False, Short Text, Paragraph
- Image support on questions and options (via Supabase Storage)
- Per-question settings: marks, negative marks, time limit, scoring method (all-or-nothing / partial credit)
- Short text accepted answers with case sensitivity and whitespace normalization
- Sections (optional grouping of questions)
- Quiz-wide feature toggles: timer, shuffle, review, score visibility, club details collection
- Publishing validation — blocks publish on fatal errors, warns on non-fatal
- Move Up / Move Down for questions and options
- Question duplication
- JSON Import/Export (canonical versioned format)
- Quiz Preview mode (non-submitting)

### Scoring Engine (`packages/shared/src/scoring.ts`)
- **Single choice**: full marks or negative marks on wrong answer
- **Multiple choice (all-or-nothing)**: must select all correct and nothing wrong
- **Multiple choice (partial credit)**: proportional marks based on correct selections
- **True/False**: same as single choice
- **Short text**: normalized comparison against accepted answers (case/space handling)
- **Paragraph**: recorded for manual review, 0 marks auto-scored
- Negative total score floor (optional `allow_negative_total` setting)

### Quiz Session System
- Attempt creation at quiz start (`POST /api/quizzes/[slug]/start`)
- Session token for submission deduplication
- Server-side expiry validation (checked at submit time)
- Auto-save to `sessionStorage` for page-reload recovery
- Configurable participant fields per quiz: name, email, phone, club, district

### Security Model
- All scoring is **server-side only** via `processQuizSubmission()`
- `is_correct`, `accepted_answers`, `case_sensitive` are **never sent to public browser**
- Public DAL strips all answer metadata
- Admin uses service role key — **never exposed to public app**

### AI Quiz Generator (Admin only)
- Powered by [Ollama](https://ollama.ai) running locally — `llama3.2:3b` by default
- Paste source content → AI converts to valid QuizMania JSON
- Modes: convert from Q&A, generate from topic, add distractors
- Full Zod validation of AI output before allowing save
- Disabled by default; toggle in Admin → Settings → AI

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A Supabase project (or use mock/offline mode for local dev)
- (Optional) Ollama running locally for AI generation

### Installation

```bash
git clone <repo>
cd quizmania
npm install
```

### Environment Setup

**`apps/admin/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Generation (optional, admin-only)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_ENABLED=false
OLLAMA_TIMEOUT_MS=60000

PORT=3011
```

**`apps/public/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

PORT=3010
```

> ⚠️ Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. Server-side only.

### Database Migrations

```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor (run in order):
# 1. supabase/migrations/20260904000001_initial_quiz_schema.sql
# 2. supabase/migrations/20260904000002_extend_quiz_engine.sql
```

### Development

```bash
npm run dev           # Both apps concurrently
npm run dev:admin     # http://localhost:3011
npm run dev:public    # http://localhost:3010
```

### Production Build

```bash
npm run build
```

---

## 🤖 Ollama AI Integration

### Setup

```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2:3b
ollama serve
```

Then in Admin → Settings → AI Configuration, enable the toggle and test the connection.

### Configuration

| Env Var | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model to use |
| `OLLAMA_ENABLED` | `false` | Must set `true` to enable |
| `OLLAMA_TIMEOUT_MS` | `60000` | Request timeout in ms |

---

## 🧪 Scoring Tests

```bash
cd packages/shared
npm test
```

Tests cover: negative marking, partial credit, case-insensitive short text, floor-at-zero total.

---

## 📦 Package Reference

### `@quizmania/types`
Key types: `QuizStatus`, `QuestionType`, `ScoringMethod`, `Quiz`, `Question`, `Option`, `Theme`, `QuizSection`, `QuizSettings`, `QuizAttempt`, `QuizFeatureFlags`, `PublicQuiz`, `PublicQuestion`, `PublicOption`, `QuizSubmissionPayload`, `QuizSubmissionResult`, `OllamaSettings`

### `@quizmania/quiz-schema`
Key exports: `questionSchema`, `quizSchema`, `quizJsonImportSchema`, `validateQuizJson()`, `quizSubmissionSchema`, `participantSchema`, `quizFeatureFlagsSchema`

### `@quizmania/shared`
Key exports: Supabase clients, `getAllQuizzes()`, `saveQuiz()`, `getPublishedQuizBySlug()`, `processQuizSubmission()`, `importQuizFromJson()`, `exportQuizToJson()`, `scoreQuestion()`, `calculateFinalScore()`, `getThemeCssVariables()`, `uploadFile()`

---

## 🌐 Public Deployment (Netlify)

The public app deploys to `quizmania.atreyakamat.dev`.

```
Build command:   cd apps/public && npm run build
Publish dir:     apps/public/.next
```

Set env vars in Netlify dashboard. **Do not deploy the admin app.**

---

## 🎨 Brand

| Token | Hex | Usage |
|---|---|---|
| Primary | `#6E123D` | Headers, brand anchors |
| Secondary | `#A50D52` | Buttons, gradients |
| Accent | `#D83B70` | Badges, interactive states |
| Blush | `#F3D6E1` | Surface backgrounds |
| Background | `#FAF8F9` | Page canvas |

---

## 👤 Creator

**QuizMania** was built by **Atreya Kamat** — web builder, platform systems developer, private tutor, and Founder of [Stix 'N' Vibes](https://stixnvibes.com).

- 🌐 [atreyakamat.dev](https://atreyakamat.dev)
- Platform: [quizmania.atreyakamat.dev](https://quizmania.atreyakamat.dev)

Hosted for **Rotaract Club of Mapusa**, RI District 3170.

---

*© QuizMania. All rights reserved.*
