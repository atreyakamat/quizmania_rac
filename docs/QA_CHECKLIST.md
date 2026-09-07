# QuizMania QA Manual Testing Checklist

Platform: **QuizMania** (Rotaract Club of Mapusa, RI District 3170)  
Architecture: Monorepo (`apps/admin` on port **3011**, `apps/public` on port **3010**)  
Default QA Quiz Slug: `quizmania-qa-full-engine-test`  

---

## Instructions for Tester
Work through each test case sequentially. Mark `[x]` for Pass or leave `[ ]` with notes for Fail.

---

## A. Admin Dashboard & Navigation

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `ADM-01` | Dashboard Load | Admin running on port 3011 | Navigate to `http://localhost:3011/` | Dashboard loads with metrics, quick actions, and sidebar links. | [ ] Pass |
| `ADM-02` | Quizzes List | Admin running | Click "All Quizzes" in sidebar | Lists all quizzes (published & drafts). "QuizMania QA — Full Engine Test" is present. | [ ] Pass |
| `ADM-03` | Drafts View | Admin running | Click "Drafts" in sidebar | Shows filtered view of quizzes in `draft` status. | [ ] Pass |
| `ADM-04` | Published View | Admin running | Click "Published" in sidebar | Shows filtered view of quizzes in `published` status. | [ ] Pass |
| `ADM-05` | Themes View | Admin running | Click "Themes" in sidebar | Displays theme cards (QuizMania Signature, Nature Green, Ocean Blue). | [ ] Pass |
| `ADM-06` | Results View | Admin running | Click "Results" in sidebar | Shows submissions table with scores, participant details, and timestamps. | [ ] Pass |
| `ADM-07` | Settings View | Admin running | Click "Settings" in sidebar | Settings page loads showing Supabase status, environment details, and AI section. | [ ] Pass |
| `ADM-08` | AI Navigation | Admin running | Click "AI Generator" in sidebar | Loads `/ai` route with model status badge and input interface. | [ ] Pass |
| `ADM-09` | Media Browser | Admin running | Click "Media Browser" in sidebar | Media tabs load for Quizzes and Questions without runtime errors. | [ ] Pass |

---

## B. Quiz Creation Workflow

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `QC-01` | Create Quiz Page | Admin running | Navigate to `http://localhost:3011/quizzes/create` | Clean quiz editor opens with default values and draft status. | [ ] Pass |
| `QC-02` | Title & Slug Auto-Gen | Create Quiz page | Type title "Rotary Youth Leadership Awards 2026" | Slug field auto-populates as `rotary-youth-leadership-awards-2026`. | [ ] Pass |
| `QC-03` | Custom Slug Edit | Title entered | Manually edit slug to `ryla-2026` | Custom slug is preserved without getting overwritten by title edits. | [ ] Pass |
| `QC-04` | Instructions Input | Create Quiz page | Enter text in "Quiz Instructions" field | Text persists in quiz configuration settings. | [ ] Pass |
| `QC-05` | Theme Assignment | Create Quiz page | Select "Nature Green" from Assigned Theme dropdown | Palette preview updates to green palette. | [ ] Pass |
| `QC-06` | Add Question | Create Quiz page | Click "+ Add Question" | New question card is added with default single-choice options. | [ ] Pass |
| `QC-07` | Question Duplication | At least 1 question | Click "Duplicate" icon on Question 1 | Exact copy of Question 1 is inserted with unique IDs. | [ ] Pass |
| `QC-08` | Reorder Questions | 2+ questions | Click "Move Down" on Question 1 | Question 1 swaps position with Question 2; orders update. | [ ] Pass |
| `QC-09` | Delete Question | 2+ questions | Click "Trash" icon on Question 2 | Question is removed; remaining question numbers re-index. | [ ] Pass |
| `QC-10` | Save Draft | Valid title & slug | Click "Save Draft" | Success banner appears; quiz is saved in draft status. | [ ] Pass |

---

## C. Question Types Engine

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `QT-01` | Single Choice | Quiz editor open | Select type "Single Choice". Add 4 options. Mark 1 as correct. | Exactly one option can be correct; clicking another toggles off the first. | [ ] Pass |
| `QT-02` | Multiple Choice | Quiz editor open | Select type "Multiple Choice". Mark 2 options as correct. | Both options retain "correct" state; scoring method selector (All-or-Nothing / Partial) appears. | [ ] Pass |
| `QT-03` | True / False | Quiz editor open | Select type "True / False". | UI shows simplified True/False choice selector; options auto-set to True and False. | [ ] Pass |
| `QT-04` | Short Text Config | Quiz editor open | Select type "Short Text". Enter accepted answers: "Rotaract, Rotaract Club". | Accepted answers chip/input saves values; Case Sensitive, Trim Whitespace, Normalize Spaces toggles visible. | [ ] Pass |
| `QT-05` | Paragraph Config | Quiz editor open | Select type "Paragraph". | Notice displayed that paragraph responses are qualitative / manual evaluation (0 auto marks). | [ ] Pass |

---

## D. Media & Image Support

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `MED-01` | Quiz Cover Upload | Quiz editor open | Click upload on Quiz Cover Image. Select JPEG/PNG/WebP. | Image preview renders; URL or local blob path is set. | [ ] Pass |
| `MED-02` | Question Image Upload | Question editor open | Upload image to question body. | Diagram/image preview renders directly below question text. | [ ] Pass |
| `MED-03` | Option Image Upload | Option editor open | Upload image on Option A. | Option thumbnail renders inside option row. | [ ] Pass |
| `MED-04` | Image Removal | Question with image | Click remove on question image. | Image is cleared; question returns to text-only presentation. | [ ] Pass |
| `MED-05` | Broken Image Handling | Public quiz runner | Open quiz with an unreachable image URL. | Image element cleanly collapses without breaking page layout or crashing. | [ ] Pass |

---

## E. Sections Engine

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `SEC-01` | Section Definition | Quiz editor open | Add Section: "Section 1: General Rotary Trivia". | Section is listed with title, description, and order. | [ ] Pass |
| `SEC-02` | Question Assignment | Sections defined | In Question 1 editor, select "Section 1" from section dropdown. | Question is assigned to Section 1. | [ ] Pass |
| `SEC-03` | Public Section Banner | Public quiz with sections | Open `http://localhost:3010/q/quizmania-qa-full-engine-test` | Section banner ("Section 1: General Knowledge...") renders before Section 1 questions. | [ ] Pass |
| `SEC-04` | Section Transition | Multi-section quiz | Answer questions and navigate between sections. | Section header updates when transitioning to questions in Section 2. | [ ] Pass |

---

## F. Settings & Feature Toggles

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `SET-01` | Passing Score % | Quiz editor settings | Set passing score to 70%. Save quiz. | Quiz settings persist 70% threshold. | [ ] Pass |
| `SET-02` | Review Toggle OFF | Quiz editor settings | Disable "Allow Review". Save quiz. Take quiz on public. | Public runner skips the Review step and submits directly on the last question. | [ ] Pass |
| `SET-03` | Immediate Score OFF | Quiz editor settings | Disable "Show Score Immediately". Submit quiz. | Completion screen displays "Submission Received" without revealing numerical score. | [ ] Pass |
| `SET-04` | Correct Answers OFF | Quiz editor settings | Disable "Show Correct Answers". Submit quiz. | Completion screen does not display question breakdown or correct answer keys. | [ ] Pass |
| `SET-05` | Participant Fields | Quiz editor settings | Toggle "Require Email" ON, "Collect Club Details" OFF. | Public registration form displays Name & Email only; Rotaract Club fields are hidden. | [ ] Pass |

---

## G. Server-Authoritative Timers

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `TIM-01` | Quiz Timer Start | QA Quiz (10 min timer) | Enter participant details and click "Start Quiz". | Sticky timer badge displays "10:00 Remaining" and counts down every second. | [ ] Pass |
| `TIM-02` | Expiry Header Sync | Timed quiz | Inspect network response of `/api/quizzes/[slug]/start`. | `expiresAt` ISO timestamp is returned by server based on startedAt + time_limit. | [ ] Pass |
| `TIM-03` | Refresh Persistence | Timed quiz in progress | Note time at 9:30 remaining. Refresh browser page (F5). | Active attempt hydrates from session storage; timer resumes from correct remaining time. | [ ] Pass |
| `TIM-04` | Auto-Submit on Timeout | Set test timer to 1 min | Let countdown reach 00:00. | System triggers auto-submit; submission is evaluated by server with `auto_submitted` status. | [ ] Pass |
| `TIM-05` | Late Submission Rejection | Network simulation | Submit payload with timestamp past `expiresAt + 15s`. | Server rejects submission with HTTP 400: "Time expired for this attempt". | [ ] Pass |

---

## H. Randomization

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `RND-01` | Shuffle Questions OFF | QA Quiz (`shuffle_questions: false`) | Open quiz in two separate incognito windows. | Questions appear in identical order (Q1, Q2, Q3...). | [ ] Pass |
| `RND-02` | Shuffle Questions ON | Edit quiz: `shuffle_questions: true` | Open quiz in two separate incognito windows. | Questions appear in randomized order across sessions. | [ ] Pass |
| `RND-03` | Shuffle Options ON | Edit quiz: `shuffle_options: true` | Check Q1 options across two sessions. | Option ordering (A, B, C, D) is shuffled across sessions. | [ ] Pass |
| `RND-04` | True/False Not Shuffled | `shuffle_options: true` | Inspect True/False question (Q3). | "True" remains first, "False" remains second (order protected). | [ ] Pass |

---

## I. JSON Import / Export

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `JSN-01` | Export Quiz JSON | Quiz details page | Click "Export JSON" button. | Valid canonical JSON file is downloaded with title, slug, settings, sections, and questions. | [ ] Pass |
| `JSN-02` | Import Valid JSON | `/quizzes` page | Open JSON Importer, paste canonical QA quiz JSON, click Import. | Quiz is successfully parsed, validated, and created as a new draft/published quiz. | [ ] Pass |
| `JSN-03` | Import Invalid JSON | JSON Importer modal | Paste malformed JSON (missing question text or slug). | Zod validation displays specific error messages indicating invalid fields; prevents import. | [ ] Pass |

---

## J. Ollama Local AI Integration

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `OLL-01` | AI Disabled by Default | Admin `/settings` | Check AI configuration card. | AI toggle is OFF; status says "AI generation is disabled". | [ ] Pass |
| `OLL-02` | Connection Test (Offline) | AI Toggle ON, Ollama not running | Click "Test Connection" button. | Displays clean warning: "Cannot reach Ollama at http://localhost:11434" without crashing. | [ ] Pass |
| `OLL-03` | Connection Test (Online) | Ollama running (`ollama serve`) | Ensure `llama3.2:3b` pulled. Click "Test Connection". | Status shows green "Connected. Model 'llama3.2:3b' is available." | [ ] Pass |
| `OLL-04` | AI Generate Workflow | AI Connected | Go to `/ai`, paste 3 Q&A questions, click "Generate Quiz". | AI converts to valid QuizMania JSON; preview list of questions renders. | [ ] Pass |
| `OLL-05` | AI Output Validation | AI Generation output | Click "Create Draft Quiz" from AI result. | Draft quiz is created; redirects to quiz editor for human review and manual publishing. | [ ] Pass |

---

## K. Publishing & Pre-Flight Validation

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `PUB-01` | Fatal Validation Check | Quiz with empty question text | Click "Publish Quiz". | Pre-publish modal blocks publication, listing fatal error: "Question text is empty". | [ ] Pass |
| `PUB-02` | Single Choice Choice Check | Single-choice Q with 0 correct marked | Click "Publish Quiz". | Fatal error: "Single choice must have exactly 1 correct answer". | [ ] Pass |
| `PUB-03` | Warning Notice Check | Short answer Q with no accepted answers | Click "Publish Quiz". | Warning badge appears (yellow); allows publication after acknowledgement. | [ ] Pass |
| `PUB-04` | Successful Publish | QA Quiz (all valid) | Click "Publish Quiz". | Status changes to `published`; green success toast displays public URL. | [ ] Pass |

---

## L. Public Quiz Taking Flow

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `PUB-05` | Quiz Landing Card | Navigate to `http://localhost:3010/quizzes` | Inspect QA Quiz card. | Title, description, question count (7), time limit (10m), and "Start Quiz" button render. | [ ] Pass |
| `PUB-06` | Participant Registration | Click "Start Quiz" | Fill in Name: "Test Runner", Email: "test@example.com", Club: "RC Mapusa". | Fields accept input; validation prevents advancing if required field is empty. | [ ] Pass |
| `PUB-07` | Instructions Screen | Instructions configured | Click "Continue" from participant form. | Instructions screen renders with full instructions text and "Begin Quiz" button. | [ ] Pass |
| `PUB-08` | Single Choice Selection | Question 1 | Click Option A ("Service Above Self"). | Option A is highlighted with primary theme color; letter badge changes to checkmark. | [ ] Pass |
| `PUB-09` | Multiple Choice Selection | Question 2 | Select "Club Service", "Community Service", "International Service". | All 3 selected options display checked checkboxes; total selections match. | [ ] Pass |
| `PUB-10` | True / False Selection | Question 3 | Click "True" button. | "True" button activates with theme highlight; "False" is unselected. | [ ] Pass |
| `PUB-11` | Short Text Input | Question 4 | Type "  rotaract  " (with leading/trailing spaces). | Text is captured in state and auto-saved to session storage. | [ ] Pass |
| `PUB-12` | Paragraph Input | Question 5 | Type a multi-line initiative description. | Textarea expands smoothly; text captured in state. | [ ] Pass |
| `PUB-13` | Question Image Render | Question 6 | View Question 6 card. | Question reference image displays clearly above answer options. | [ ] Pass |
| `PUB-14` | Option Image Render | Question 7 | View Question 7 card. | Answer choice cards render both thumbnail image and descriptive text. | [ ] Pass |
| `PUB-15` | Progress Bar | Navigating questions | Move from Q1 to Q7. | Progress bar fills proportionally (14% -> 100%). | [ ] Pass |
| `PUB-16` | Review Matrix | On Q7, click "Review Answers" | Review screen displays 7-question grid showing Answered vs Unanswered status. | Clicking any question card jumps directly back to that question. | [ ] Pass |

---

## M. Submission & Server Scoring Evaluation

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `SCR-01` | Full Marks Submission | On Review screen | Answers: Q1=A (+5), Q2=A,B,C (+6), Q3=True (+4), Q4="Rotaract" (+5), Q5=text (+0), Q6=A (+5), Q7=A (+5). Click "Submit Quiz". | Score: **30 / 30 (100%)**. "Passed" badge with celebratory confetti. | [ ] Pass |
| `SCR-02` | Negative Marks Deduction | Review screen | Answer Q1 incorrectly (Option B). Other questions correct. | Score: **23 / 30** (5 marks forfeited + 2 negative marks deducted from Q1). | [ ] Pass |
| `SCR-03` | Partial Credit Evaluation | Review screen | On Q2, select 2 correct options out of 3 ("Club", "Community"). | Earns partial credit: 4 out of 6 marks for Q2. | [ ] Pass |
| `SCR-04` | Short Text Normalization | Review screen | Answer Q4 with "  rOtArAcT cLuB  ". | Correctly matches accepted answer case-insensitively; awards full 5 marks. | [ ] Pass |
| `SCR-05` | Negative Floor Check | New submission | Answer all questions with incorrect choices having negative marks. | Final score floors at **0** (does not go below 0 unless `allow_negative_total: true`). | [ ] Pass |

---

## N. Duplicate Submission & Session Protection

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `SEC-01` | Duplicate Submit Block | Quiz completed | Click browser back button and attempt to click "Submit Quiz" again with same token. | Server returns HTTP 400: "Quiz already submitted for this attempt". | [ ] Pass |
| `SEC-02` | Session Storage Cleanup | Quiz completed | Check browser `sessionStorage` in DevTools. | `quiz_active_attempt_${quiz.id}` and `quiz_attempt_${attemptId}` are cleaned up. | [ ] Pass |

---

## O. Security & Answer Key Leakage Audit

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `AUD-01` | Public API Response | DevTools Network tab | Inspect GET response for `http://localhost:3010/q/quizmania-qa-full-engine-test`. | Options array contains `id, option_text, option_image, option_order`. `is_correct` is completely absent. | [ ] Pass |
| `AUD-02` | Short Text Key Leak | DevTools Network tab | Inspect question payload for Q4 (Short Text). | `accepted_answers` and `case_sensitive` fields are completely absent from public JSON. | [ ] Pass |
| `AUD-03` | Service Role Key Audit | Client JS bundle | Search client-side scripts for `service_role`. | `SUPABASE_SERVICE_ROLE_KEY` is not present in client bundles. | [ ] Pass |

---

## P. Responsive & Mobile Functionality

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `MOB-01` | Mobile Viewport (375px) | Chrome DevTools device mode | Set viewport to iPhone SE (375x667). Navigate to `/q/quizmania-qa-full-engine-test`. | Clean layout, readable text, no horizontal scroll, buttons easily tappable. | [ ] Pass |
| `MOB-02` | Mobile Sticky Timer | Mobile viewport | Start timed quiz. | Sticky timer stays docked at top without obscuring question content. | [ ] Pass |
| `MOB-03` | Option Touch Target | Mobile viewport | Tap option tiles. | Generous touch target area (>= 48px height) with instant visual feedback. | [ ] Pass |

---

## Q. Supabase & Mock Fallback Verification

| Test ID | Area | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| `ENV-01` | Mock Fallback Mode | Supabase tables unmigrated | Start admin and public apps. | Platform runs 100% reliably in mock fallback mode; no unhandled crashes. | [ ] Pass |
| `ENV-02` | Live Supabase Mode | Migrations applied to Supabase | Execute `supabase/qa_seed.sql` in Supabase SQL editor. | Data loads into live tables; app reads/writes from live database seamlessly. | [ ] Pass |
| `ENV-03` | QA Reset Verification | Submissions made | Run `node scripts/qa-manager.mjs reset`. | QA test submissions are cleared; production quizzes and data remain untouched. | [ ] Pass |

---

## Summary Sign-Off
- **Tester Name:** _____________________
- **Date Tested:** _____________________
- **Total Tests:** 52
- **Passed:** _____ / 52
- **Notes / Observations:**
