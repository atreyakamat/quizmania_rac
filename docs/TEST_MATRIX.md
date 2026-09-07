# QuizMania Feature Interaction & Scenario Test Matrix

This matrix documents combinations of feature toggles and configuration settings to verify that enabling or disabling one feature does not create regressions or hidden bugs in another.

---

## Matrix 1: Timing & Submission Modes

| Scenario ID | Timer | Auto-Submit | Review Screen | Config Setup in Admin | Expected User Experience |
|---|---|---|---|---|---|
| `SCN-T1` | **OFF** | N/A | **ON** | `time_limit_minutes: null`, `allow_review: true` | No countdown banner displayed. Participant takes unlimited time. Reaches Review screen with full answer grid before submitting. |
| `SCN-T2` | **OFF** | N/A | **OFF** | `time_limit_minutes: null`, `allow_review: false` | No countdown banner. On the final question, the Next button directly submits the quiz without showing a Review grid. |
| `SCN-T3` | **ON** | **ON** | **ON** | `time_limit_minutes: 10`, `auto_submit_on_expire: true`, `allow_review: true` | Sticky countdown timer counts down. Participant can freely toggle between questions and review screen. When timer reaches 00:00, quiz auto-submits current answers immediately. |
| `SCN-T4` | **ON** | **ON** | **OFF** | `time_limit_minutes: 10`, `auto_submit_on_expire: true`, `allow_review: false` | Countdown timer visible. Direct submit on last question. If time expires mid-quiz, answers collected so far are evaluated and submitted. |
| `SCN-T5` | **ON** | **OFF** | **ON** | `time_limit_minutes: 10`, `auto_submit_on_expire: false`, `allow_review: true` | Timer displays red expired notice at 00:00. Participant must explicitly click Submit to conclude. Late submissions past grace period receive expiration notice. |

---

## Matrix 2: Layout & Randomization Combinations

| Scenario ID | Sections | Shuffle Questions | Shuffle Options | Config Setup in Admin | Expected User Experience |
|---|---|---|---|---|---|
| `SCN-L1` | **OFF** | **OFF** | **OFF** | `sections: false`, `shuffle_questions: false`, `shuffle_options: false` | Questions render in fixed chronological order (Q1 -> Q7) without section headers. Options A, B, C, D remain fixed. |
| `SCN-L2` | **ON** | **OFF** | **OFF** | `sections: true`, `shuffle_questions: false`, `shuffle_options: false` | Section 1 banner renders before Q1. Questions advance in sequence. Section 2 banner renders before Q4. Option orders remain fixed. |
| `SCN-L3` | **OFF** | **ON** | **OFF** | `sections: false`, `shuffle_questions: true`, `shuffle_options: false` | Questions are pseudo-randomized across participants. Internal option choices remain fixed. Total question count and marks match. |
| `SCN-L4` | **OFF** | **OFF** | **ON** | `sections: false`, `shuffle_questions: false`, `shuffle_options: true` | Question sequence is identical for all users, but choices inside MCQ questions are shuffled. True/False questions preserve True first and False second. |
| `SCN-L5` | **ON** | **ON** | **ON** | `sections: true`, `shuffle_questions: true`, `shuffle_options: true` | Full randomization: questions shuffled, options shuffled. Section metadata still reflects respective question categories. |

---

## Matrix 3: Results & Feedback Visibility

| Scenario ID | Immediate Score | Show Correct Answers | Passing Score % | Config Setup in Admin | Expected User Experience |
|---|---|---|---|---|---|
| `SCN-R1` | **ON** | **ON** | 50% | `show_score_immediately: true`, `show_correct_answers: true` | Complete transparency: Participant sees their exact score (e.g. 26/30), percentage (87%), pass/fail status, confetti, AND detailed question-by-question breakdown showing right/wrong choices. |
| `SCN-R2` | **ON** | **OFF** | 50% | `show_score_immediately: true`, `show_correct_answers: false` | Competitive / Exam mode: Participant sees their total score and pass/fail status, but question breakdown and correct answer keys are NOT returned or shown. |
| `SCN-R3` | **OFF** | **OFF** | 50% | `show_score_immediately: false`, `show_correct_answers: false` | Blind Competition mode: Screen displays "Thank you for participating! Submissions are recorded." No scores, percentages, or answer keys are revealed to participant. |
| `SCN-R4` | **OFF** | **ON** | 50% | `show_score_immediately: false`, `show_correct_answers: true` | Validated fallback: Platform gracefully treats `show_score_immediately: false` as authoritative, suppressing public score display while preserving recorded answers server-side. |

---

## Matrix 4: Session & Attempt Enforcement

| Scenario ID | Multiple Attempts | Prevent Duplicate | Preconditions & Actions | Expected Result |
|---|---|---|---|---|
| `SCN-A1` | **ON** | **OFF** | User completes quiz once. Refreshes page or re-enters registration form with same name & email. | New attempt is initialized (`attempt_number: 2`). Participant can take the quiz again and submit a new score. |
| `SCN-A2` | **OFF** | **ON** | Quiz configured with `prevent_duplicate_submission: true`. User completes quiz once. Attempts to take quiz with same email. | System detects prior submission for participant email and displays notice: "You have already completed this quiz." |
| `SCN-A3` | Browser Back Navigation | Stale Attempt | User completes quiz, reaches Completion screen, then clicks Browser Back button to return to Review screen and clicks Submit. | Server rejects submission with HTTP 400: "Quiz already submitted for this attempt". Stale session storage is already cleared. |

---

## Matrix 5: Artificial Intelligence (Ollama) Operational Modes

| Scenario ID | AI Toggle | Ollama Daemon | Expected Behavior in Admin |
|---|---|---|---|
| `SCN-AI1` | **OFF** | Stopped / Not Installed | Default state. AI features are completely dormant. AI Generator tab shows guidance on how to enable. No background network requests or performance overhead. |
| `SCN-AI2` | **ON** | Stopped (`http://localhost:11434` unreachable) | Admin navigates to `/settings` or `/ai`. Connection status displays friendly notification: "Cannot reach Ollama at http://localhost:11434. Run `ollama serve`". Zero application crashes. |
| `SCN-AI3` | **ON** | Running, but `llama3.2:3b` not pulled | Status displays: "Model 'llama3.2:3b' not found. Run `ollama pull llama3.2:3b`". Available models (if any) are listed. |
| `SCN-AI4` | **ON** | Running with `llama3.2:3b` ready | Status shows green "Connected". In `/ai`, user pastes raw questions. AI produces schema-compliant JSON, validates via Zod, and creates an editable draft quiz. |

---

## How to Execute the Matrix
1. Pick a scenario code (e.g., `SCN-T3` or `SCN-R2`).
2. Go to Admin (`http://localhost:3011/quizzes`), open "QuizMania QA — Full Engine Test" in Editor.
3. Adjust the settings to match the scenario configuration and click "Save Draft" or "Publish Quiz".
4. Open the public quiz URL (`http://localhost:3010/q/quizmania-qa-full-engine-test`) in a fresh or incognito browser tab.
5. Complete the flow and verify that the actual behavior matches the **Expected User Experience**.
