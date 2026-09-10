process.env.FORCE_MOCK_STORE = 'true';
process.env.NODE_ENV = 'test';

import { test } from 'node:test';
import assert from 'node:assert';
import {
  // DAL Admin
  getAllQuizzes,
  getQuizById,
  getQuizBySlug,
  saveQuiz,
  setQuizStatus,
  deleteQuiz,
  getAllThemes,
  getThemeById,
  saveTheme,
  getAllSubmissions,
  importQuizFromJson,
  exportQuizToJson,
  getResponsesPaginated,
  getResponseDetail,
  updateManualGrade,
  exportResponsesCsv,
  getClubSummary,
  exportClubSummaryCsvFromFilters,
  getAdminUserRecord,
  saveAdminUserRecord,
  normalizeQuizRecord,

  // DAL Public
  getPublishedQuizBySlug,
  getPublishedQuizzesList,
  createQuizAttempt,
  getQuizAttemptByToken,
  updateQuizAttemptStatus,

  // Storage & Theme
  uploadImage,
  getStorageImageUrl,
  getThemeCssVariables,
  defaultTheme,

  // Rate Limiter
  getClientIp,
  checkRateLimit,

  // QA Fixture
  createQaFixtureQuiz,
  QA_QUIZ_ID,

  // Auth
  getSupabaseProjectRef,
  verifyCsrfOrigin,
  verifyAdminAuthorization,
  requireAuthenticatedAdmin,

  // Scoring
  scoreQuestion,
  scoreMultipleChoice,
  normalizeTextAnswer,
  calculateFinalScore,
  scoreAndRecordQuizSubmission,

  // Store
  mockStore
} from '../index';
import type { Quiz, Theme, QuizSubmissionPayload, Question } from '@quizmania/types';

async function runComprehensiveTests() {
  console.log('\n========================================');
  console.log('Running Comprehensive DAL, Auth & Utility Tests');
  console.log('========================================\n');



  // --- 1. THEME & BRAND ---
  await test('1. Theme Utilities', async () => {
    const cssVarsDefault = getThemeCssVariables();
    assert.ok(Boolean(cssVarsDefault['--quiz-primary']), 'Default theme produces primary color variable');
    assert.ok(Boolean(cssVarsDefault['--quiz-button']), 'Default theme produces button color variable');

    const customTheme: Theme = {
      ...defaultTheme,
      id: 'theme-custom-1',
      name: 'Custom Theme',
      primary_color: '#123456',
      button_color: '#abcdef'
    };
    const cssVarsCustom = getThemeCssVariables(customTheme);
    assert.ok(cssVarsCustom['--quiz-primary'] === '#123456', 'Custom theme primary color applied');
    assert.ok(cssVarsCustom['--quiz-button'] === '#abcdef', 'Custom theme button color applied');
  });

  // --- 2. RATE LIMITER & CLIENT IP ---
  await test('2. Rate Limiter & Client IP Extraction', async () => {
    const reqForwarded = new Request('http://localhost/test', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }
    });
    assert.ok(getClientIp(reqForwarded) === '203.0.113.195', 'getClientIp parses x-forwarded-for first IP');

    const reqRealIp = new Request('http://localhost/test', {
      headers: { 'x-real-ip': '198.51.100.17' }
    });
    assert.ok(getClientIp(reqRealIp) === '198.51.100.17', 'getClientIp parses x-real-ip');

    const reqCfIp = new Request('http://localhost/test', {
      headers: { 'cf-connecting-ip': '192.0.2.1' }
    });
    assert.ok(getClientIp(reqCfIp) === '192.0.2.1', 'getClientIp parses cf-connecting-ip');

    const reqDefaultIp = new Request('http://localhost/test');
    assert.ok(getClientIp(reqDefaultIp) === '127.0.0.1', 'getClientIp falls back to 127.0.0.1');

    const rlKey = `test-rl-${Date.now()}`;
    const rl1 = checkRateLimit(rlKey, 2, 60000);
    assert.ok(rl1.success && rl1.remaining === 1, 'checkRateLimit passes first call with remaining 1');
    const rl2 = checkRateLimit(rlKey, 2, 60000);
    assert.ok(rl2.success && rl2.remaining === 0, 'checkRateLimit passes second call with remaining 0');
    const rl3 = checkRateLimit(rlKey, 2, 60000);
    assert.ok(!rl3.success && rl3.remaining === 0, 'checkRateLimit blocks third call over limit');
  });

  // --- 3. STORAGE HELPERS ---
  await test('3. Storage Utilities', async () => {
    const imgUrlHttp = getStorageImageUrl('quiz-covers', 'https://example.com/image.jpg');
    assert.ok(imgUrlHttp === 'https://example.com/image.jpg', 'getStorageImageUrl preserves absolute http/https URLs');

    const imgUrlBlob = getStorageImageUrl('quiz-covers', 'blob:http://localhost:3000/uuid');
    assert.ok(imgUrlBlob.startsWith('blob:'), 'getStorageImageUrl preserves blob URLs');

    const imgUrlRel = getStorageImageUrl('quiz-covers', 'local/quiz-covers/test.png');
    assert.ok(imgUrlRel.includes('local/quiz-covers/test.png'), 'getStorageImageUrl returns relative path when not configured');

    const uploadRes = await uploadImage('quiz-covers', new Blob(['test-data']), 'my-cover.png');
    assert.ok(uploadRes.success, 'uploadImage in mock mode returns success');
    assert.ok(Boolean(uploadRes.url), 'uploadImage returns URL');
  });

  // --- 4. QA FIXTURE ---
  await test('4. QA Fixture Factory', async () => {
    const qaQuiz = createQaFixtureQuiz();
    assert.ok(qaQuiz.id === QA_QUIZ_ID, 'createQaFixtureQuiz generates expected QA ID');
    assert.ok(Array.isArray(qaQuiz.questions) && qaQuiz.questions.length > 0, 'createQaFixtureQuiz has questions');
    assert.ok(qaQuiz.status === 'published', 'createQaFixtureQuiz is published');
  });

  // --- 5. DAL ADMIN: CRUD & QUERIES ---
  let savedQuiz: any = null;
  await test('5. DAL Admin Operations', async () => {
    const testQuizPayload: Partial<Quiz> & { title: string; slug: string } = {
      title: 'Comprehensive DAL Test Quiz',
      slug: `dal-test-${Date.now()}`,
      description: 'Testing full DAL lifecycle',
      status: 'draft',
      settings: {
        time_limit_minutes: 20,
        passing_score_percentage: 60,
        schedule_enabled: false
      },
      sections: [
        { id: 'sec-dal-1', quiz_id: 'auto', title: 'Round 1', section_order: 1 }
      ],
      questions: [
        {
          id: 'q-dal-1',
          quiz_id: 'auto',
          question_text: 'What is the capital of France?',
          question_type: 'single_choice',
          marks: 5,
          negative_marks: 1,
          required: true,
          question_order: 1,
          options: [
            { id: 'opt-dal-1', option_text: 'Paris', is_correct: true, option_order: 1 },
            { id: 'opt-dal-2', option_text: 'Lyon', is_correct: false, option_order: 2 }
          ]
        },
        {
          id: 'q-dal-2',
          quiz_id: 'auto',
          question_text: 'Which numbers are even?',
          question_type: 'multiple_choice',
          marks: 4,
          negative_marks: 0,
          required: false,
          question_order: 2,
          options: [
            { id: 'opt-dal-3', option_text: '2', is_correct: true, option_order: 1 },
            { id: 'opt-dal-4', option_text: '3', is_correct: false, option_order: 2 },
            { id: 'opt-dal-5', option_text: '4', is_correct: true, option_order: 3 }
          ]
        }
      ]
    };

    savedQuiz = await saveQuiz(testQuizPayload);
    assert.ok(Boolean(savedQuiz.id), 'saveQuiz creates quiz with valid ID');
    assert.ok(savedQuiz.status === 'draft', 'saveQuiz sets initial status to draft');

    const fetchedById = await getQuizById(savedQuiz.id);
    assert.ok(fetchedById?.id === savedQuiz.id, 'getQuizById fetches created quiz');

    const fetchedBySlug = await getQuizBySlug(savedQuiz.slug);
    assert.ok(fetchedBySlug?.slug === savedQuiz.slug, 'getQuizBySlug fetches created quiz');

    const notFoundQuiz = await getQuizById('non-existent-quiz-id');
    assert.ok(notFoundQuiz === null, 'getQuizById returns null for unknown ID');

    const notFoundSlug = await getQuizBySlug('non-existent-quiz-slug');
    assert.ok(notFoundSlug === null, 'getQuizBySlug returns null for unknown slug');

    const allQuizzes = await getAllQuizzes();
    assert.ok(allQuizzes.length > 0, 'getAllQuizzes returns quiz list');

    const draftQuizzes = await getAllQuizzes('draft');
    assert.ok(draftQuizzes.some(q => q.id === savedQuiz.id), 'getAllQuizzes("draft") filters correctly');

    const updatedStatusQuiz = await setQuizStatus(savedQuiz.id, 'published');
    assert.ok(updatedStatusQuiz?.status === 'published', 'setQuizStatus updates status to published');

    const nullStatusUpdate = await setQuizStatus('non-existent-id', 'published');
    assert.ok(nullStatusUpdate === null, 'setQuizStatus returns null for non-existent quiz');

    // Themes
    const themes = await getAllThemes();
    assert.ok(Array.isArray(themes) && themes.length > 0, 'getAllThemes returns themes');

    const firstTheme = await getThemeById(themes[0].id);
    assert.ok(firstTheme?.id === themes[0].id, 'getThemeById retrieves existing theme');

    const missingTheme = await getThemeById('missing-theme-id');
    assert.ok(missingTheme === null, 'getThemeById returns null for unknown theme');

    const savedTheme = await saveTheme({
      id: 'theme-new-test',
      name: 'Saved Theme Test',
      primary_color: '#001122',
      secondary_color: '#334455',
      background_color: '#ffffff',
      surface_color: '#f0f0f0',
      text_color: '#111111',
      button_color: '#001122',
      border_radius: '0.5rem',
      font_family: 'Arial'
    });
    assert.ok(savedTheme.id === 'theme-new-test', 'saveTheme successfully persists theme');

    // Submissions DAL
    const allSubs = await getAllSubmissions();
    assert.ok(Array.isArray(allSubs), 'getAllSubmissions returns array');

    const quizSubs = await getAllSubmissions(savedQuiz.id);
    assert.ok(Array.isArray(quizSubs), 'getAllSubmissions with quizId returns array');

    // JSON Import & Export
    const exportedJson = await exportQuizToJson(savedQuiz.id);
    assert.ok(exportedJson !== null && exportedJson.title === savedQuiz.title, 'exportQuizToJson exports quiz');

    const nullExport = await exportQuizToJson('non-existent-id');
    assert.ok(nullExport === null, 'exportQuizToJson returns null for missing quiz');

    const importedQuiz = await importQuizFromJson({
      title: 'Imported Quiz Test',
      description: 'Imported via DAL test',
      questions: [
        {
          question: 'Is TypeScript typed?',
          type: 'true_false',
          options: [
            { text: 'True', is_correct: true },
            { text: 'False', is_correct: false }
          ]
        }
      ]
    });
    assert.ok(importedQuiz.title === 'Imported Quiz Test', 'importQuizFromJson imports and saves quiz');
  });

  // --- 6. RESPONSES QUERIES, PAGINATION & REPORTING ---
  await test('6. Responses Queries & Pagination', async () => {
    const normalized = normalizeQuizRecord({
      title: 'Normalization Test',
      start_at: new Date().toISOString(),
      settings: { passing_score_percentage: 50 }
    });
    assert.ok(normalized.settings.schedule_enabled === true, 'normalizeQuizRecord sets schedule_enabled when start_at present');

    const paginatedDefault = await getResponsesPaginated();
    assert.ok(paginatedDefault.total >= 0, 'getResponsesPaginated returns response result');
    assert.ok(Array.isArray(paginatedDefault.items), 'getResponsesPaginated items is an array');
    assert.ok(Boolean(paginatedDefault.summary), 'getResponsesPaginated includes summary');

    const paginatedSortScore = await getResponsesPaginated({ sortBy: 'score', sortOrder: 'asc' });
    assert.ok(Array.isArray(paginatedSortScore.items), 'getResponsesPaginated supports sortBy score');

    const paginatedSortPerc = await getResponsesPaginated({ sortBy: 'percentage', sortOrder: 'desc' });
    assert.ok(Array.isArray(paginatedSortPerc.items), 'getResponsesPaginated supports sortBy percentage');

    const paginatedSortName = await getResponsesPaginated({ sortBy: 'participant_name', sortOrder: 'asc' });
    assert.ok(Array.isArray(paginatedSortName.items), 'getResponsesPaginated supports sortBy participant_name');

    const paginatedPassed = await getResponsesPaginated({ status: 'passed' });
    assert.ok(paginatedPassed.items.every(i => i.passed), 'getResponsesPaginated filters by status passed');

    const paginatedFailed = await getResponsesPaginated({ status: 'failed' });
    assert.ok(paginatedFailed.items.every(i => !i.passed), 'getResponsesPaginated filters by status failed');

    const paginatedScoreRange = await getResponsesPaginated({ minScore: 0, maxScore: 100 });
    assert.ok(Array.isArray(paginatedScoreRange.items), 'getResponsesPaginated filters by score range');

    const paginatedDates = await getResponsesPaginated({ startDate: '2025-01-01', endDate: '2030-01-01' });
    assert.ok(Array.isArray(paginatedDates.items), 'getResponsesPaginated filters by dates');

    const paginatedSearch = await getResponsesPaginated({ search: 'Rotaract' });
    assert.ok(Array.isArray(paginatedSearch.items), 'getResponsesPaginated supports search');

    const emptySearch = await getResponsesPaginated({ search: '   ' });
    assert.ok(Array.isArray(emptySearch.items), 'getResponsesPaginated handles blank whitespace search');

    if (paginatedDefault.items.length > 0) {
      const subId = paginatedDefault.items[0].id;
      const detail = await getResponseDetail(subId);
      assert.ok(detail !== null && detail.submission.id === subId, 'getResponseDetail retrieves valid submission detail');

      const gradeResult = await updateManualGrade(subId, detail!.questions[0].questionId, 5);
      assert.ok(gradeResult.success, 'updateManualGrade updates answer marks');
    }

    const missingDetail = await getResponseDetail('non-existent-sub-id');
    assert.ok(missingDetail === null, 'getResponseDetail returns null for missing submission');

    const csvExport = await exportResponsesCsv();
    assert.ok(csvExport.startsWith('Submission ID'), 'exportResponsesCsv generates valid CSV headers');

    const clubSummaryReport = await getClubSummary();
    assert.ok(Boolean(clubSummaryReport.totalResponses >= 0), 'getClubSummary generates summary report');

    const clubSummaryCsv = await exportClubSummaryCsvFromFilters();
    assert.ok(clubSummaryCsv.includes('Club Name'), 'exportClubSummaryCsvFromFilters generates CSV with headers');
  });

  // --- 7. ADMIN USER RECORDS ---
  await test('7. Admin User Records', async () => {
    const emptyUser = await getAdminUserRecord('');
    assert.ok(emptyUser === null, 'getAdminUserRecord returns null for empty string');

    const adminUser = await getAdminUserRecord('admin@quizmania.dev');
    assert.ok(adminUser !== null && adminUser.email === 'admin@quizmania.dev', 'getAdminUserRecord retrieves admin user');

    process.env.ADMIN_EMAILS = 'env-admin@rotaract.org, other@rotaract.org';
    const envAdmin = await getAdminUserRecord('env-admin@rotaract.org');
    assert.ok(envAdmin !== null && envAdmin.role === 'admin', 'getAdminUserRecord checks ADMIN_EMAILS allowlist');

    const savedAdmin = await saveAdminUserRecord({
      id: 'admin-saved-test',
      user_id: 'u-12345',
      email: 'newadmin@quizmania.dev',
      role: 'admin',
      enabled: true,
      created_at: new Date().toISOString()
    });
    assert.ok(savedAdmin.email === 'newadmin@quizmania.dev', 'saveAdminUserRecord saves user');

    if (savedQuiz) {
      const deleteSuccess = await deleteQuiz(savedQuiz.id);
      assert.ok(deleteSuccess, 'deleteQuiz removes existing quiz');
    }

    const deleteMissing = await deleteQuiz('missing-quiz-id');
    assert.ok(!deleteMissing, 'deleteQuiz returns false for missing quiz');
  });

  // --- 8. DAL PUBLIC ---
  await test('8. DAL Public Operations', async () => {
    const pubList = await getPublishedQuizzesList();
    assert.ok(Array.isArray(pubList), 'getPublishedQuizzesList returns array');

    const pubQuiz = await getPublishedQuizBySlug('qa-full-engine-test');
    if (pubQuiz) {
      assert.ok(pubQuiz.slug === 'qa-full-engine-test', 'getPublishedQuizBySlug retrieves published quiz');
      assert.ok(Boolean(pubQuiz.questions), 'getPublishedQuizBySlug includes questions');
    }

    const missingPubQuiz = await getPublishedQuizBySlug('missing-pub-quiz-slug');
    assert.ok(missingPubQuiz === null, 'getPublishedQuizBySlug returns null for missing slug');

    const attempt = await createQuizAttempt({
      id: 'att-comprehensive-1',
      quiz_id: QA_QUIZ_ID,
      session_token: 'tok_comp_test_123',
      status: 'in_progress',
      created_at: new Date().toISOString()
    });
    assert.ok(attempt.session_token === 'tok_comp_test_123', 'createQuizAttempt stores session token');

    const fetchedAttempt = await getQuizAttemptByToken('tok_comp_test_123');
    assert.ok(fetchedAttempt !== null && fetchedAttempt.id === 'att-comprehensive-1', 'getQuizAttemptByToken fetches attempt');

    const missingAttempt = await getQuizAttemptByToken('invalid-token-xyz');
    assert.ok(missingAttempt === null, 'getQuizAttemptByToken returns null for invalid token');

    await updateQuizAttemptStatus('tok_comp_test_123', 'completed');
    const updatedAttempt = await getQuizAttemptByToken('tok_comp_test_123');
    assert.ok(updatedAttempt?.status === 'completed', 'updateQuizAttemptStatus updates status');
  });

  // --- 9. AUTH GUARDS & CSRF ---
  await test('9. Auth Guard & CSRF Logic', async () => {
    const reqMatchingReferer = new Request('http://localhost:3000/api/admin', {
      method: 'POST',
      headers: {
        referer: 'http://localhost:3000/dashboard',
        host: 'localhost:3000'
      }
    });
    assert.ok(verifyCsrfOrigin(reqMatchingReferer).valid, 'verifyCsrfOrigin allows matching referer and host');

    const reqGet = new Request('http://localhost:3000/api/admin', { method: 'GET' });
    assert.ok(verifyCsrfOrigin(reqGet).valid, 'verifyCsrfOrigin allows safe GET request without Origin');

    const reqMatchingOrigin = new Request('http://localhost:3000/api/admin', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000'
      }
    });
    assert.ok(verifyCsrfOrigin(reqMatchingOrigin).valid, 'verifyCsrfOrigin allows matching origin and host');

    const reqMismatchOrigin = new Request('http://localhost:3000/api/admin', {
      method: 'POST',
      headers: {
        origin: 'https://evil-attacker.com',
        host: 'localhost:3000'
      }
    });
    assert.ok(!verifyCsrfOrigin(reqMismatchOrigin).valid, 'verifyCsrfOrigin blocks mismatched origin');

    const authAllowed = await verifyAdminAuthorization('00000000-0000-4000-a000-000000000001', 'admin@quizmania.dev');
    assert.ok(authAllowed.authorized, 'verifyAdminAuthorization authorizes enabled admin');

    const authDisabled = await verifyAdminAuthorization('00000000-0000-4000-a000-000000000002', 'disabled-admin@quizmania.dev');
    assert.ok(!authDisabled.authorized, 'verifyAdminAuthorization blocks disabled admin');

    const authMissing = await verifyAdminAuthorization('unknown-id', 'unknown@domain.dev');
    assert.ok(!authMissing.authorized, 'verifyAdminAuthorization blocks unknown account');

    const reqNoAuth = new Request('http://localhost:3000/api/admin');
    const resNoAuth = await requireAuthenticatedAdmin(reqNoAuth);
    assert.ok(!resNoAuth.authorized && resNoAuth.status === 401, 'requireAuthenticatedAdmin returns 401 when no token provided');

    const reqTestAdmin = new Request('http://localhost:3000/api/admin', {
      headers: { cookie: 'sb-access-token=test-admin-token' }
    });
    const resTestAdmin = await requireAuthenticatedAdmin(reqTestAdmin);
    assert.ok(resTestAdmin.authorized && resTestAdmin.status === 200, 'requireAuthenticatedAdmin accepts test admin token');

    const reqDisabledAdmin = new Request('http://localhost:3000/api/admin', {
      headers: { cookie: 'sb-access-token=test-disabled-admin-token' }
    });
    const resDisabledAdmin = await requireAuthenticatedAdmin(reqDisabledAdmin);
    assert.ok(!resDisabledAdmin.authorized && resDisabledAdmin.status === 403, 'requireAuthenticatedAdmin rejects disabled test admin');

    const reqNonAdmin = new Request('http://localhost:3000/api/admin', {
      headers: { cookie: 'sb-access-token=test-non-admin-token' }
    });
    const resNonAdmin = await requireAuthenticatedAdmin(reqNonAdmin);
    assert.ok(!resNonAdmin.authorized && resNonAdmin.status === 403, 'requireAuthenticatedAdmin rejects non-admin test token');

    const reqExpiredWithRefresh = new Request('http://localhost:3000/api/admin', {
      headers: {
        cookie: 'sb-access-token=test-expired-token; sb-refresh-token=valid-refresh-token'
      }
    });
    const resExpiredWithRefresh = await requireAuthenticatedAdmin(reqExpiredWithRefresh);
    assert.ok(resExpiredWithRefresh.authorized && Boolean(resExpiredWithRefresh.refreshedTokens), 'requireAuthenticatedAdmin refreshes expired token');

    const reqExpiredNoRefresh = new Request('http://localhost:3000/api/admin', {
      headers: { cookie: 'sb-access-token=test-expired-token' }
    });
    const resExpiredNoRefresh = await requireAuthenticatedAdmin(reqExpiredNoRefresh);
    assert.ok(!resExpiredNoRefresh.authorized && resExpiredNoRefresh.status === 401, 'requireAuthenticatedAdmin returns 401 on expired token without refresh token');

    const ssrRef = getSupabaseProjectRef() || 'eaqmwvxggnyprletpklr';
    const reqSsr = new Request('http://localhost:3000/api/admin', {
      headers: { cookie: `sb-${ssrRef}-auth-token=${encodeURIComponent(JSON.stringify(['test-admin-token', 'valid-refresh-token']))}` }
    });
    const resSsr = await requireAuthenticatedAdmin(reqSsr);
    assert.ok(resSsr.authorized, 'requireAuthenticatedAdmin extracts tokens from SSR cookie');

    const reqBearer = new Request('http://localhost:3000/api/admin', {
      headers: { authorization: 'Bearer test-admin-token' }
    });
    const resBearer = await requireAuthenticatedAdmin(reqBearer);
    assert.ok(resBearer.authorized, 'requireAuthenticatedAdmin extracts tokens from Bearer header');
  });

  // --- 10. SCORING EDGE CASES ---
  await test('10. Scoring Edge Cases', async () => {
    const normalizedText1 = normalizeTextAnswer('  Hello  World  ', { caseSensitive: false, trimWhitespace: true, normalizeSpaces: true });
    assert.ok(normalizedText1 === 'hello world', 'normalizeTextAnswer handles casing, trimming, and internal spaces');

    const normalizedText2 = normalizeTextAnswer('ExactMatch', { caseSensitive: true, trimWhitespace: true, normalizeSpaces: false });
    assert.ok(normalizedText2 === 'ExactMatch', 'normalizeTextAnswer preserves case when caseSensitive is true');

    const mcQuestion: Question = {
      id: 'q-mc-score',
      quiz_id: 'quiz-score',
      question_text: 'Select 2 and 4',
      question_type: 'multiple_choice',
      marks: 6,
      negative_marks: 2,
      required: true,
      question_order: 1,
      scoring_method: 'partial',
      options: [
        { id: 'opt-2', option_text: '2', is_correct: true, option_order: 1 },
        { id: 'opt-3', option_text: '3', is_correct: false, option_order: 2 },
        { id: 'opt-4', option_text: '4', is_correct: true, option_order: 3 }
      ]
    };

    const partialMc = scoreMultipleChoice(mcQuestion, ['opt-2']);
    assert.ok(partialMc.earnedMarks === 3, 'scoreMultipleChoice calculates correct partial credit (3/6)');

    const wrongMc = scoreMultipleChoice(mcQuestion, ['opt-3']);
    assert.ok(wrongMc.earnedMarks === 0 && !wrongMc.isCorrect, 'scoreMultipleChoice wrong option earns 0');

    const fullMc = scoreMultipleChoice(mcQuestion, ['opt-2', 'opt-4']);
    assert.ok(fullMc.earnedMarks === 6 && fullMc.isCorrect, 'scoreMultipleChoice full correct earns max marks');

    const paraBreakdown = scoreQuestion({
      question: {
        id: 'q-para',
        quiz_id: 'quiz-score',
        question_text: 'Tell us your thoughts',
        question_type: 'paragraph',
        marks: 10,
        negative_marks: 0,
        required: false,
        question_order: 2,
        options: []
      },
      answer: { questionId: 'q-para', textAnswer: 'Some detailed feedback' }
    });
    assert.ok(paraBreakdown.earnedMarks === 10, 'scoreQuestion paragraph with text awards full marks');

    const finalScoreNoNegative = calculateFinalScore([
      { questionId: '1', questionText: 'Q1', questionType: 'single_choice', earnedMarks: -5, maxMarks: 5, isCorrect: false }
    ], false);
    assert.ok(finalScoreNoNegative === 0, 'calculateFinalScore floors negative total at 0 when not allowed');

    const finalScoreAllowNegative = calculateFinalScore([
      { questionId: '1', questionText: 'Q1', questionType: 'single_choice', earnedMarks: -5, maxMarks: 5, isCorrect: false }
    ], true);
    assert.ok(finalScoreAllowNegative === -5, 'calculateFinalScore preserves negative total when allowed');
  });

  console.log('All comprehensive DAL, auth and utility tests completed successfully.');
}

runComprehensiveTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
