import type { Theme, Quiz, Submission, Answer } from '@quizmania/types';
import { generateCanonicalUuid } from '@quizmania/quiz-schema';
import { QUIZMANIA_BRAND } from './brand/quizmania-theme';

export const mockThemes: Theme[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'QuizMania Signature (Rotaract)',
    primary_color: QUIZMANIA_BRAND.colors.primary,
    secondary_color: QUIZMANIA_BRAND.colors.secondary,
    background_color: QUIZMANIA_BRAND.colors.background,
    surface_color: QUIZMANIA_BRAND.colors.surface,
    text_color: QUIZMANIA_BRAND.colors.darkText,
    button_color: QUIZMANIA_BRAND.colors.secondary,
    border_radius: '1rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    name: 'Nature Green',
    primary_color: '#2E7D32',
    secondary_color: '#81C784',
    background_color: '#F1F8E9',
    surface_color: '#FFFFFF',
    text_color: '#1A1A1A',
    button_color: '#2E7D32',
    border_radius: '0.75rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    name: 'Ocean Blue',
    primary_color: '#0284C7',
    secondary_color: '#7DD3FC',
    background_color: '#F0F9FF',
    surface_color: '#FFFFFF',
    text_color: '#0C4A6E',
    button_color: '#0284C7',
    border_radius: '1rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  }
];

import { createQaFixtureQuiz, QA_QUIZ_ID } from './fixtures/qa-fixture';

export const mockQuizzes: Quiz[] = [];

export const mockSubmissions: Submission[] = [];

export interface MockAttempt {
  id: string;
  quiz_id: string;
  session_token: string;
  participant_name: string;
  participant_email?: string | null;
  participant_data?: Record<string, any> | null;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  status: 'started' | 'in_progress' | 'submitted' | 'auto_submitted' | 'expired' | 'abandoned';
}

export interface AdminUserRecord {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'superadmin' | 'editor';
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export const defaultMockAdminUsers: AdminUserRecord[] = typeof window === 'undefined' ? [
  {
    id: '00000000-0000-4000-a000-000000000001',
    user_id: '00000000-0000-4000-a000-000000000001',
    email: 'admin@quizmania.dev',
    role: 'admin',
    enabled: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    user_id: '00000000-0000-4000-a000-000000000002',
    email: 'disabled-admin@quizmania.dev',
    role: 'admin',
    enabled: false,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-4000-a000-000000000003',
    user_id: '00000000-0000-4000-a000-000000000003',
    email: 'user@example.com',
    role: 'editor',
    enabled: true,
    created_at: new Date().toISOString()
  }
] : [];

function getNodeModule(name: string): any {
  if (typeof window !== 'undefined') return null;
  try {
    const req = (globalThis as any).__non_webpack_require__ !== undefined
      ? (globalThis as any).__non_webpack_require__
      : eval('require');
    return req(name);
  } catch {
    return null;
  }
}

/**
 * Resolves a secure, isolated application-controlled path for mock store persistence.
 * 
 * Remediation for CWE-377 / CWE-379 / CWE-59:
 * 1. User Isolation: Creates an isolated directory scoped to the current OS user ID (e.g. quizmania-store-<uid>).
 * 2. Directory Permissions (0o700): Created with mode 0o700 so other system users cannot read, write, or enter.
 * 3. File Permissions (0o600): Mock files are written with mode 0o600 (owner read/write only).
 * 4. Symlink Defense: Validates via lstat that any existing file is a regular file and NOT a symbolic link.
 * 5. Execution Boundary: This directory stores only JSON serialized test/mock data and never executes code.
 */
function getSecureStoreFilePath(): string | null {
  if (typeof window !== 'undefined') return null;
  const fs = getNodeModule('fs');
  const os = getNodeModule('os');
  const path = getNodeModule('path');
  if (!fs || !os || !path) return null;

  try {
    const customDir = process.env.QUIZMANIA_STORE_DIR;
    let baseDir: string;

    if (customDir && typeof customDir === 'string') {
      baseDir = path.resolve(customDir);
    } else {
      const uid = typeof process.getuid === 'function' ? process.getuid() : 'shared';
      baseDir = path.join(os.tmpdir(), `quizmania-store-${uid}`);
    }

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true, mode: 0o700 });
    }

    return path.join(baseDir, 'quizmania-local-store.json');
  } catch {
    return null;
  }
}

function readStoreFile(): { quizzes?: Quiz[]; themes?: Theme[]; submissions?: Submission[]; attempts?: MockAttempt[]; answers?: Answer[]; adminUsers?: AdminUserRecord[] } | null {
  const fs = getNodeModule('fs');
  if (!fs) return null;
  const filePath = getSecureStoreFilePath();
  if (!filePath) return null;

  try {
    if (fs.existsSync(filePath)) {
      // Symlink defense (CWE-59): verify regular file, not a symlink
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        console.warn('Security: Refusing to read mock store from a symlink or non-regular file.');
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // fallback to in-memory
  }
  return null;
}

function writeStoreFile(data: { quizzes: Quiz[]; themes: Theme[]; submissions: Submission[]; attempts: MockAttempt[]; answers?: Answer[]; adminUsers?: AdminUserRecord[] }) {
  const fs = getNodeModule('fs');
  if (!fs) return;
  const filePath = getSecureStoreFilePath();
  if (!filePath) return;

  try {
    // Symlink defense: verify existing target is not a symlink
    if (fs.existsSync(filePath)) {
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        console.warn('Security: Refusing to overwrite symlink in mock store.');
        return;
      }
    }
    // Write with restrictive 0o600 permissions
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch {
    // ignore
  }
}

class MockStore {
  quizzes: Quiz[] = [];
  themes: Theme[] = JSON.parse(JSON.stringify(mockThemes));
  submissions: Submission[] = [];
  attempts: MockAttempt[] = [];
  answers: Answer[] = [];
  adminUsers: AdminUserRecord[] = JSON.parse(JSON.stringify(defaultMockAdminUsers));

  constructor() {
    this.syncFromDisk();
  }

  syncFromDisk() {
    const data = readStoreFile();
    if (!data) {
      this.syncToDisk();
      return;
    }
    this.hydrateFromStoreData(data);
  }

  private hydrateFromStoreData(data: NonNullable<ReturnType<typeof readStoreFile>>) {
    if (Array.isArray(data.quizzes)) this.quizzes = data.quizzes;
    if (Array.isArray(data.themes) && data.themes.length > 0) this.themes = data.themes;
    if (Array.isArray(data.submissions)) this.submissions = data.submissions;
    if (Array.isArray(data.attempts)) this.attempts = data.attempts;
    if (Array.isArray(data.answers)) this.answers = data.answers;
    if (Array.isArray(data.adminUsers) && data.adminUsers.length > 0) this.adminUsers = data.adminUsers;
  }

  syncToDisk() {
    writeStoreFile({
      quizzes: this.quizzes,
      themes: this.themes,
      submissions: this.submissions,
      attempts: this.attempts,
      answers: this.answers,
      adminUsers: this.adminUsers
    });
  }

  getAdminUser(userIdOrEmail: string): AdminUserRecord | null {
    this.syncFromDisk();
    const search = userIdOrEmail.trim().toLowerCase();
    return this.adminUsers.find(u => u.user_id === userIdOrEmail || u.email.toLowerCase() === search) || null;
  }

  saveAdminUser(admin: AdminUserRecord): AdminUserRecord {
    this.syncFromDisk();
    const index = this.adminUsers.findIndex(u => u.user_id === admin.user_id || u.email.toLowerCase() === admin.email.toLowerCase());
    if (index >= 0) {
      this.adminUsers[index] = { ...this.adminUsers[index], ...admin, updated_at: new Date().toISOString() };
    } else {
      this.adminUsers.push(admin);
    }
    this.syncToDisk();
    return admin;
  }

  createAttempt(attempt: MockAttempt): MockAttempt {
    this.syncFromDisk();
    this.attempts.push(attempt);
    this.syncToDisk();
    return attempt;
  }

  getAttemptByToken(token: string): MockAttempt | undefined {
    this.syncFromDisk();
    return this.attempts.find(a => a.session_token === token);
  }

  updateAttemptStatus(token: string, status: MockAttempt['status'], submittedAt?: string): void {
    this.syncFromDisk();
    const attempt = this.attempts.find(a => a.session_token === token);
    if (attempt) {
      attempt.status = status;
      if (submittedAt) attempt.submitted_at = submittedAt;
      this.syncToDisk();
    }
  }

  getQuizzes(): Quiz[] {
    this.syncFromDisk();
    return JSON.parse(JSON.stringify(this.quizzes));
  }

  getQuizById(id: string): Quiz | undefined {
    this.syncFromDisk();
    const found = this.quizzes.find(q => q.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : undefined;
  }

  getQuizBySlug(slug: string): Quiz | undefined {
    this.syncFromDisk();
    const found = this.quizzes.find(q => q.slug === slug);
    return found ? JSON.parse(JSON.stringify(found)) : undefined;
  }

  saveQuiz(quiz: Quiz): Quiz {
    this.syncFromDisk();
    const quizId = quiz.id || generateCanonicalUuid();
    const processedQuestions = quiz.questions?.map((q, qIdx) => {
      const qId = q.id || generateCanonicalUuid();
      return {
        ...q,
        id: qId,
        quiz_id: quizId,
        question_order: q.question_order ?? (qIdx + 1),
        options: (q.options || []).map((opt, optIdx) => ({
          ...opt,
          id: opt.id || generateCanonicalUuid(),
          question_id: qId,
          option_order: opt.option_order ?? (optIdx + 1)
        }))
      };
    });

    const processedSections = quiz.sections?.map((s, sIdx) => ({
      ...s,
      id: s.id || generateCanonicalUuid(),
      quiz_id: quizId,
      section_order: s.section_order ?? (sIdx + 1)
    }));

    const existingIndex = this.quizzes.findIndex(q => q.id === quiz.id || q.slug === quiz.slug);
    if (existingIndex >= 0) {
      this.quizzes[existingIndex] = {
        ...this.quizzes[existingIndex],
        ...quiz,
        id: this.quizzes[existingIndex].id,
        questions: processedQuestions ?? this.quizzes[existingIndex].questions,
        sections: processedSections ?? this.quizzes[existingIndex].sections,
        updated_at: new Date().toISOString()
      };
      this.syncToDisk();
      return JSON.parse(JSON.stringify(this.quizzes[existingIndex]));
    }

    const newQuiz: Quiz = {
      ...quiz,
      id: quizId,
      questions: processedQuestions ?? [],
      sections: processedSections ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.quizzes.unshift(newQuiz);
    this.syncToDisk();
    return JSON.parse(JSON.stringify(newQuiz));
  }

  updateQuizStatus(id: string, status: Quiz['status']): Quiz | undefined {
    this.syncFromDisk();
    const quiz = this.quizzes.find(q => q.id === id);
    if (quiz) {
      quiz.status = status;
      quiz.updated_at = new Date().toISOString();
      this.syncToDisk();
    }
    return quiz;
  }

  deleteQuiz(id: string): boolean {
    this.syncFromDisk();
    const initialLen = this.quizzes.length;
    this.quizzes = this.quizzes.filter(q => q.id !== id);
    this.submissions = this.submissions.filter(s => s.quiz_id !== id);
    this.attempts = this.attempts.filter(a => a.quiz_id !== id);
    const deleted = this.quizzes.length < initialLen;
    if (deleted) {
      this.syncToDisk();
    }
    return deleted;
  }

  getThemes(): Theme[] {
    return this.themes;
  }

  saveTheme(theme: Theme): Theme {
    const existingIndex = this.themes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      this.themes[existingIndex] = { ...this.themes[existingIndex], ...theme };
      return this.themes[existingIndex];
    }
    const newTheme: Theme = {
      ...theme,
      id: theme.id || `theme-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.themes.push(newTheme);
    return newTheme;
  }

  addSubmission(submission: Submission, answers?: Answer[]): Submission {
    this.syncFromDisk();
    this.submissions.unshift(submission);
    if (answers && answers.length > 0) {
      this.answers.unshift(...answers);
    }
    this.syncToDisk();
    return submission;
  }

  getSubmissionById(id: string): Submission | undefined {
    this.syncFromDisk();
    return this.submissions.find(s => s.id === id);
  }

  getSubmissions(quizId?: string): Submission[] {
    this.syncFromDisk();
    if (quizId) {
      return this.submissions.filter(s => s.quiz_id === quizId);
    }
    return this.submissions;
  }

  getAnswers(submissionId: string): Answer[] {
    this.syncFromDisk();
    return this.answers.filter(a => a.submission_id === submissionId);
  }

  updateAnswerMarks(submissionId: string, questionId: string, earnedMarks: number): { success: boolean; newScore: number; newPercentage: number } {
    this.syncFromDisk();
    const ansIndex = this.answers.findIndex(a => a.submission_id === submissionId && a.question_id === questionId);
    if (ansIndex >= 0) {
      this.answers[ansIndex].earned_marks = earnedMarks;
    }

    const subIndex = this.submissions.findIndex(s => s.id === submissionId);
    if (subIndex < 0) {
      return { success: false, newScore: 0, newPercentage: 0 };
    }

    // Recompute total earned marks from all answers of this submission
    const subAnswers = this.answers.filter(a => a.submission_id === submissionId);
    let totalScore = 0;
    for (const a of subAnswers) {
      totalScore += Number(a.earned_marks) || 0;
    }

    const sub = this.submissions[subIndex];
    const totalPossible = sub.total_possible_marks || 1;
    const newPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    
    // Check passing status
    const quiz = this.quizzes.find(q => q.id === sub.quiz_id);
    const passingPercentage = quiz?.settings?.passing_score_percentage ?? 50;
    const passed = newPercentage >= passingPercentage;

    this.submissions[subIndex] = {
      ...sub,
      score: totalScore,
      percentage: newPercentage,
      passed
    };

    this.syncToDisk();
    return { success: true, newScore: totalScore, newPercentage };
  }

  loadQaFixture(): Quiz {
    const fixture = createQaFixtureQuiz();
    const idx = this.quizzes.findIndex(q => q.id === QA_QUIZ_ID);
    if (idx >= 0) {
      this.quizzes[idx] = JSON.parse(JSON.stringify(fixture));
    } else {
      this.quizzes.unshift(JSON.parse(JSON.stringify(fixture)));
    }
    return fixture;
  }

  resetQaData(): { resetSubmissions: number; resetAttempts: number } {
    const prevSubs = this.submissions.length;
    const prevAttempts = this.attempts.length;
    this.submissions = this.submissions.filter(s => s.quiz_id !== QA_QUIZ_ID);
    this.attempts = this.attempts.filter(a => a.quiz_id !== QA_QUIZ_ID);
    this.loadQaFixture();
    return {
      resetSubmissions: prevSubs - this.submissions.length,
      resetAttempts: prevAttempts - this.attempts.length
    };
  }
}

const globalAny = global as any;
if (!globalAny.__QUIZMANIA_MOCK_STORE__) {
  globalAny.__QUIZMANIA_MOCK_STORE__ = new MockStore();
}

export const mockStore: MockStore = globalAny.__QUIZMANIA_MOCK_STORE__;
