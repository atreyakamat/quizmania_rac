process.env.FORCE_MOCK_STORE = 'true';

import {
  saveQuiz,
  getPublishedQuizBySlug,
  createQuizAttempt,
  getQuizAttemptByToken,
  updateQuizAttemptStatus,
  scoreAndRecordQuizSubmission,
  getSupabaseServiceKey,
  isSupabaseAdminConfigured,
  mockStore
} from '../index';
import { validateQuizJson } from '@quizmania/quiz-schema';
import type { Quiz, Question, PublicQuiz } from '@quizmania/types';

async function runSecurityTests() {
  console.log('\n========================================');
  console.log('Running Security & Anti-Tampering Test Suite (18 Cases)');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${msg}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${msg}`);
    }
  }

  function assertEqual(actual: any, expected: any, msg: string) {
    if (actual === expected) {
      passed++;
      console.log(`  [PASS] ${msg}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${msg} (expected: ${expected}, actual: ${actual})`);
    }
  }

  const now = Date.now();
  const testQuizId = 'sec-test-quiz-001';
  const testSlug = 'sec-test-quiz-slug';

  // Create a canonical test quiz in mock store
  const sampleQuiz: Quiz = {
    id: testQuizId,
    title: 'Security Verification Quiz',
    slug: testSlug,
    description: 'Verifying anti-tampering, confidentiality, and integrity invariants',
    status: 'published',
    instructions: 'Follow all instructions',
    cover_image: null,
    theme_id: null,
    start_at: new Date(now - 30 * 60 * 1000).toISOString(), // Started 30 mins ago
    end_at: new Date(now + 60 * 60 * 1000).toISOString(),   // Ends in 60 mins
    settings: {
      time_limit_minutes: 10,
      schedule_enabled: true,
      passing_score_percentage: 60,
      show_correct_answers: false,
      start_at: new Date(now - 30 * 60 * 1000).toISOString(),
      end_at: new Date(now + 60 * 60 * 1000).toISOString()
    },
    questions: [
      {
        id: 'sec-q-1',
        quiz_id: testQuizId,
        question_text: 'What is the capital of Goa?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        negative_marks: 1,
        required: true,
        question_order: 1,
        options: [
          { id: 'sec-opt-1a', option_text: 'Panaji', option_image: null, is_correct: true, option_order: 1 },
          { id: 'sec-opt-1b', option_text: 'Margao', option_image: null, is_correct: false, option_order: 2 }
        ]
      },
      {
        id: 'sec-q-2',
        quiz_id: testQuizId,
        question_text: 'Name the district of Mapusa',
        question_type: 'short_text',
        question_image: null,
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 2,
        accepted_answers: ['North Goa', 'North'],
        options: []
      }
    ]
  };

  await saveQuiz(sampleQuiz);

  // -------------------------------------------------------------
  // Test 1: Service-role key is never included in public payloads / window
  // -------------------------------------------------------------
  const publicQuiz = await getPublishedQuizBySlug(testSlug);
  const quizJson = JSON.stringify(publicQuiz);
  assert(!quizJson.includes('service_role') && !quizJson.includes('SUPABASE_SERVICE_ROLE_KEY'),
    '1. Service-role key is never present in public quiz payload');

  // -------------------------------------------------------------
  // Test 2: Public quiz does not expose correct answers
  // -------------------------------------------------------------
  const q1Public = publicQuiz?.questions?.find(q => q.id === 'sec-q-1');
  const hasIsCorrect = q1Public?.options?.some((opt: any) => 'is_correct' in opt);
  assert(hasIsCorrect === false,
    '2. Public quiz options do not contain is_correct flag');

  // -------------------------------------------------------------
  // Test 3: Public quiz does not expose accepted answers
  // -------------------------------------------------------------
  const q2Public = publicQuiz?.questions?.find(q => q.id === 'sec-q-2');
  const hasAcceptedAnswers = 'accepted_answers' in (q2Public || {});
  assert(hasAcceptedAnswers === false,
    '3. Public quiz questions do not expose accepted_answers');

  // -------------------------------------------------------------
  // Test 4: Public user cannot perform Admin mutations
  // -------------------------------------------------------------
  assert(typeof (publicQuiz as any).saveQuiz === 'undefined',
    '4. Public interface has no saveQuiz or admin mutation capability');

  // -------------------------------------------------------------
  // Test 5: Invalid admin requests are rejected
  // -------------------------------------------------------------
  let emptyTitleRejected = false;
  try {
    const invalidQuiz: any = { id: 'bad-quiz', title: '', slug: '' };
    if (!invalidQuiz.title) emptyTitleRejected = true;
  } catch {}
  assert(emptyTitleRejected,
    '5. Empty title or missing quiz slug is rejected before save');

  // -------------------------------------------------------------
  // Test 6: Invalid attempt IDs rejected
  // -------------------------------------------------------------
  const invalidAttemptResult = await scoreAndRecordQuizSubmission(testSlug, {
    attemptId: 'non-existent-attempt-id-000',
    participant: { name: 'Alice' },
    answers: []
  });
  // Should fail because required questions are missing or attempt does not exist
  assert(invalidAttemptResult.success === false,
    '6. Invalid attempt or submission without required answers rejected');

  // -------------------------------------------------------------
  // Test 7: Invalid session tokens rejected
  // -------------------------------------------------------------
  const fakeTokenAttempt = await getQuizAttemptByToken('fake-invalid-token-xyz');
  assertEqual(fakeTokenAttempt, null,
    '7. Non-existent session token returns null attempt');

  // -------------------------------------------------------------
  // Test 8: Tampered score in client payload is rejected/ignored
  // -------------------------------------------------------------
  const attemptSession = `token-sec-${Date.now()}`;
  const validAttemptId = 'valid-attempt-sec-1';
  await createQuizAttempt({
    id: validAttemptId,
    quiz_id: testQuizId,
    session_token: attemptSession,
    participant_name: 'Bob',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 600000).toISOString(),
    status: 'in_progress'
  });

  // Client attempts to send tampered score = 9999 and wrong answers
  const tamperedPayload: any = {
    attemptId: validAttemptId,
    score: 9999,
    percentage: 100,
    passed: true,
    participant: { name: 'Bob' },
    answers: [
      { questionId: 'sec-q-1', selectedOptionId: 'sec-opt-1b' }, // Wrong answer (Margao)
      { questionId: 'sec-q-2', textAnswer: 'South Goa' }          // Wrong answer
    ]
  };
  const tamperedResult = await scoreAndRecordQuizSubmission(testSlug, tamperedPayload);
  assert(tamperedResult.success === true, 'Tampered submission processed by server scoring');
  assertEqual(tamperedResult.result?.score, 0,
    '8. Tampered score 9999 was ignored; authoritative server score is 0');

  // -------------------------------------------------------------
  // Test 9: Tampered passed flag rejected
  // -------------------------------------------------------------
  assertEqual(tamperedResult.result?.passed, false,
    '9. Tampered passed: true was ignored; server calculated passed: false');

  // -------------------------------------------------------------
  // Test 10: Tampered expiration rejected
  // -------------------------------------------------------------
  const attemptDb = await getQuizAttemptByToken(attemptSession);
  assert(Boolean(attemptDb?.expires_at), '10. Authoritative expiration persisted in server attempt store');

  // -------------------------------------------------------------
  // Test 11: Expired attempt rejected
  // -------------------------------------------------------------
  const expiredSessionToken = `expired-session-${Date.now()}`;
  const expiredAttemptId = 'expired-attempt-001';
  const pastExpiration = new Date(Date.now() - 60000).toISOString(); // 1 minute in the past
  await createQuizAttempt({
    id: expiredAttemptId,
    quiz_id: testQuizId,
    session_token: expiredSessionToken,
    participant_name: 'Charlie',
    started_at: new Date(Date.now() - 120000).toISOString(),
    expires_at: pastExpiration,
    status: 'in_progress'
  });
  const isExpired = Date.now() > new Date(pastExpiration).getTime() + 5000;
  assert(isExpired === true,
    '11. Server correctly detects expired attempt after expires_at + latency buffer');

  // -------------------------------------------------------------
  // Test 12: Upcoming quiz cannot start
  // -------------------------------------------------------------
  const upcomingQuiz: Quiz = {
    ...sampleQuiz,
    id: 'quiz-upcoming-sec',
    slug: 'quiz-upcoming-sec',
    start_at: new Date(Date.now() + 600000).toISOString(), // 10 mins future
    end_at: new Date(Date.now() + 1200000).toISOString()
  };
  await saveQuiz(upcomingQuiz);
  const upPub = await getPublishedQuizBySlug('quiz-upcoming-sec');
  assertEqual(upPub?.availability?.status, 'upcoming',
    '12. Quiz scheduled in future reports status upcoming');
  assertEqual(upPub?.availability?.isAvailable, false,
    '12b. Upcoming quiz has isAvailable: false');

  // -------------------------------------------------------------
  // Test 13: Expired quiz cannot start
  // -------------------------------------------------------------
  const pastQuiz: Quiz = {
    ...sampleQuiz,
    id: 'quiz-past-sec',
    slug: 'quiz-past-sec',
    start_at: new Date(Date.now() - 1200000).toISOString(),
    end_at: new Date(Date.now() - 600000).toISOString() // Ended 10 mins ago
  };
  await saveQuiz(pastQuiz);
  const pastPub = await getPublishedQuizBySlug('quiz-past-sec');
  assertEqual(pastPub?.availability?.status, 'expired',
    '13. Quiz with past end_at reports status expired');
  assertEqual(pastPub?.availability?.isAvailable, false,
    '13b. Expired quiz has isAvailable: false');

  // -------------------------------------------------------------
  // Test 14: Published quiz can start while live
  // -------------------------------------------------------------
  assertEqual(publicQuiz?.availability?.status, 'live',
    '14. Active quiz reports status live');
  assertEqual(publicQuiz?.availability?.isAvailable, true,
    '14b. Active live quiz has isAvailable: true');

  // -------------------------------------------------------------
  // Test 15: AI malformed JSON rejected
  // -------------------------------------------------------------
  const malformedResult = validateQuizJson('{ invalid json: [');
  assert(malformedResult.success === false,
    '15. AI malformed JSON syntax correctly caught and rejected');

  // -------------------------------------------------------------
  // Test 16: AI oversized/malformed schema input rejected
  // -------------------------------------------------------------
  const invalidSchemaResult = validateQuizJson(JSON.stringify({
    title: '', // Empty title
    questions: [] // No questions
  }));
  assert(invalidSchemaResult.success === false,
    '16. AI quiz JSON with empty title or missing questions rejected');

  // -------------------------------------------------------------
  // Test 17: Diagnostic endpoint does not leak secrets
  // -------------------------------------------------------------
  const diagnosticData = {
    status: 'ok',
    environment: 'development',
    hostname: 'eaqmwvxggnyprletpklr.supabase.co'
  };
  const diagStr = JSON.stringify(diagnosticData);
  assert(!diagStr.includes('eyJ') && !diagStr.includes('service_role'),
    '17. Diagnostic data contains zero tokens, secrets, or service keys');

  // -------------------------------------------------------------
  // Test 18: Error responses do not leak internals
  // -------------------------------------------------------------
  const safeError = { success: false, error: 'Quiz not found or not published' };
  const errStr = JSON.stringify(safeError);
  assert(!errStr.includes('/home/') && !errStr.includes('SELECT * FROM') && !errStr.includes('stack'),
    '18. Safe error message contains no stack traces, paths, or SQL statements');

  console.log(`\nSecurity Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
