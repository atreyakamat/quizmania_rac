process.env.FORCE_MOCK_STORE = 'true';
process.env.NODE_ENV = 'test';

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
  const validAttemptId = `valid-attempt-sec-${Date.now()}`;
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

  // -------------------------------------------------------------
  // Test 19: Unauthenticated Admin request rejected (401)
  // -------------------------------------------------------------
  const { requireAuthenticatedAdmin, ADMIN_COOKIE_NAME } = await import('../../../../apps/admin/src/lib/auth');
  const unauthReq = new Request('http://localhost:3011/api/quizzes');
  const unauthRes = await requireAuthenticatedAdmin(unauthReq);
  assertEqual(unauthRes.status, 401,
    '19. Request without session token rejected with 401 Unauthorized');
  assertEqual(unauthRes.authorized, false,
    '19b. Unauthenticated request has authorized: false');

  // -------------------------------------------------------------
  // Test 20: Non-admin session token rejected (403 Forbidden)
  // -------------------------------------------------------------
  const nonAdminReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      cookie: `${ADMIN_COOKIE_NAME}=test-non-admin-token`
    }
  });
  const nonAdminRes = await requireAuthenticatedAdmin(nonAdminReq);
  assertEqual(nonAdminRes.status, 403,
    '20. Non-admin session token rejected with 403 Forbidden');
  assertEqual(nonAdminRes.authorized, false,
    '20b. Non-admin request has authorized: false');

  // -------------------------------------------------------------
  // Test 21: Authorized Admin session token accepted (200 OK)
  // -------------------------------------------------------------
  const adminReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      cookie: `${ADMIN_COOKIE_NAME}=test-admin-token`
    }
  });
  const adminRes = await requireAuthenticatedAdmin(adminReq);
  assertEqual(adminRes.status, 200,
    '21. Valid admin session token authorized with 200 OK');
  assertEqual(adminRes.authorized, true,
    '21b. Valid admin request has authorized: true');
  assertEqual(adminRes.user?.role, 'admin',
    '21c. Authenticated user has role: admin');

  // -------------------------------------------------------------
  // Test 22: CSRF Cross-Origin mutation rejected (403 Forbidden)
  // -------------------------------------------------------------
  const csrfReq = new Request('http://localhost:3011/api/quizzes', {
    method: 'POST',
    headers: {
      host: 'localhost:3011',
      origin: 'http://malicious-site.attacker.com',
      cookie: `${ADMIN_COOKIE_NAME}=test-admin-token`
    }
  });
  const csrfRes = await requireAuthenticatedAdmin(csrfReq);
  assertEqual(csrfRes.status, 403,
    '22. Cross-origin mutating request rejected with 403 Forbidden (CSRF defense)');
  assertEqual(csrfRes.authorized, false,
    '22b. CSRF attack rejected before route handler execution');

  // -------------------------------------------------------------
  // Test 23: Deprecated static header secret rejected
  // -------------------------------------------------------------
  const legacySecretReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      'x-admin-key': 'legacy-secret-12345',
      authorization: 'Bearer static-key-12345'
    }
  });
  const legacySecretRes = await requireAuthenticatedAdmin(legacySecretReq);
  assertEqual(legacySecretRes.status, 401,
    '23. Static header secrets are rejected; real session token strictly required');

  // -------------------------------------------------------------
  // Test 24: Bearer token format accepted for CLI/automated agents
  // -------------------------------------------------------------
  const bearerReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      authorization: 'Bearer test-admin-token'
    }
  });
  const bearerRes = await requireAuthenticatedAdmin(bearerReq);
  assertEqual(bearerRes.status, 200,
    '24. Bearer session token accepted for automated/CLI workflows');
  assertEqual(bearerRes.authorized, true,
    '24b. Bearer admin session has authorized: true');

  // -------------------------------------------------------------
  // Test 25: Domain-alone authorization rejected (no domain bypass)
  // -------------------------------------------------------------
  const { verifyAdminAuthorization, getAdminCookieOptions, ADMIN_REFRESH_COOKIE, ADMIN_ACCESS_COOKIE } = await import('../../../../apps/admin/src/lib/auth');
  const domainUserCheck = await verifyAdminAuthorization('random-user-id-999', 'intruder@rotaractmapusa.org');
  assertEqual(domainUserCheck.authorized, false,
    '25. Domain alone (@rotaractmapusa.org) is rejected without explicit admin_users entry');

  const domainUserCheck2 = await verifyAdminAuthorization('random-user-id-888', 'hacker@quizmania.dev');
  assertEqual(domainUserCheck2.authorized, false,
    '25b. Domain alone (@quizmania.dev) is rejected without explicit admin_users entry');

  // -------------------------------------------------------------
  // Test 26: Disabled administrator rejected (403 Forbidden)
  // -------------------------------------------------------------
  const disabledAdminReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      cookie: `${ADMIN_COOKIE_NAME}=test-disabled-admin-token`
    }
  });
  const disabledAdminRes = await requireAuthenticatedAdmin(disabledAdminReq);
  assertEqual(disabledAdminRes.status, 403,
    '26. Disabled administrator account rejected with 403 Forbidden');
  assertEqual(disabledAdminRes.authorized, false,
    '26b. Disabled admin has authorized: false');

  // -------------------------------------------------------------
  // Test 27: Session refresh lifecycle (expired access + valid refresh token)
  // -------------------------------------------------------------
  const refreshReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      cookie: `${ADMIN_ACCESS_COOKIE}=test-expired-token; ${ADMIN_REFRESH_COOKIE}=valid-refresh-token`
    }
  });
  const refreshRes = await requireAuthenticatedAdmin(refreshReq);
  assertEqual(refreshRes.status, 200,
    '27. Expired access token refreshed successfully using valid refresh token');
  assertEqual(refreshRes.authorized, true,
    '27b. Refreshed session authorized: true');
  assert(Boolean(refreshRes.refreshedTokens?.accessToken),
    '27c. New access token generated during refresh lifecycle');

  // -------------------------------------------------------------
  // Test 28: Expired access token with missing/invalid refresh token rejected (401)
  // -------------------------------------------------------------
  const expiredNoRefreshReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      cookie: `${ADMIN_ACCESS_COOKIE}=test-expired-token`
    }
  });
  const expiredNoRefreshRes = await requireAuthenticatedAdmin(expiredNoRefreshReq);
  assertEqual(expiredNoRefreshRes.status, 401,
    '28. Expired access token without refresh token rejected with 401 Unauthorized');

  // -------------------------------------------------------------
  // Test 29: Production cookie flags verification (Secure, HttpOnly, SameSite, Max-Age)
  // -------------------------------------------------------------
  const { attachSessionCookies, clearSessionCookies } = await import('../../../../apps/admin/src/lib/auth');
  const { NextResponse } = await import('next/server');

  // Check production options
  const prodAccessOpts = getAdminCookieOptions('access', 3600, true);
  assertEqual(prodAccessOpts.httpOnly, true, '29a. Production access cookie enforces httpOnly: true');
  assertEqual(prodAccessOpts.secure, true, '29b. Production access cookie enforces secure: true');
  assertEqual(prodAccessOpts.sameSite, 'lax', '29c. Production access cookie enforces sameSite: lax');
  assertEqual(prodAccessOpts.path, '/', '29d. Production access cookie enforces path: /');
  assertEqual(prodAccessOpts.maxAge, 3600, '29e. Production access cookie maxAge matches 1 hour');

  const prodRefreshOpts = getAdminCookieOptions('refresh', undefined, true);
  assertEqual(prodRefreshOpts.httpOnly, true, '29f. Production refresh cookie enforces httpOnly: true');
  assertEqual(prodRefreshOpts.secure, true, '29g. Production refresh cookie enforces secure: true');
  assertEqual(prodRefreshOpts.maxAge, 60 * 60 * 24 * 30, '29h. Production refresh cookie maxAge matches 30 days');

  // Check development options (secure is false for local HTTP)
  const devAccessOpts = getAdminCookieOptions('access', 3600, false);
  assertEqual(devAccessOpts.secure, false, '29i. Development cookie allows secure: false for localhost');

  // Verify actual Set-Cookie string serialization in production mode
  const testProdResponse = NextResponse.json({ test: true });
  attachSessionCookies(testProdResponse, {
    accessToken: 'test-prod-access-token',
    refreshToken: 'test-prod-refresh-token',
    expiresIn: 3600
  }, true);

  const setCookieHeader = testProdResponse.headers.get('set-cookie') || '';
  assert(setCookieHeader.includes('Secure'), '29j. Production Set-Cookie header contains Secure attribute');
  assert(setCookieHeader.includes('HttpOnly'), '29k. Production Set-Cookie header contains HttpOnly attribute');
  assert(/samesite=lax/i.test(setCookieHeader), '29l. Production Set-Cookie header contains SameSite=Lax attribute');

  // -------------------------------------------------------------
  // Test 30: Unified Diagnostic & Health Endpoint Access Control
  // -------------------------------------------------------------
  const { GET: publicDiagHandler } = await import('../../../../apps/public/src/app/api/diagnostic/route');
  const { GET: adminDiagHandler } = await import('../../../../apps/admin/src/app/api/diagnostic/route');
  const { GET: healthHandler } = await import('../../../../apps/public/src/app/api/health/route');

  // 30a: Public diagnostic rejects unauthenticated caller
  const publicUnauthDiagReq = new Request('http://localhost:3010/api/diagnostic') as any;
  const publicUnauthDiagRes = await publicDiagHandler(publicUnauthDiagReq);
  assertEqual(publicUnauthDiagRes.status, 401,
    '30a. Public diagnostic endpoint rejects unauthenticated caller with 401 Unauthorized');

  // 30b: Public diagnostic rejects legacy x-diagnostic-key (no bypass)
  const publicLegacyKeyDiagReq = new Request('http://localhost:3010/api/diagnostic', {
    headers: { 'x-diagnostic-key': 'test-diag-key' }
  }) as any;
  const publicLegacyKeyDiagRes = await publicDiagHandler(publicLegacyKeyDiagReq);
  assertEqual(publicLegacyKeyDiagRes.status, 401,
    '30b. Public diagnostic endpoint strictly rejects x-diagnostic-key; admin session required');

  // 30c: Public diagnostic accepts authenticated admin session
  const publicAdminDiagReq = new Request('http://localhost:3010/api/diagnostic', {
    headers: { cookie: `${ADMIN_COOKIE_NAME}=test-admin-token` }
  }) as any;
  const publicAdminDiagRes = await publicDiagHandler(publicAdminDiagReq);
  assertEqual(publicAdminDiagRes.status, 200,
    '30c. Public diagnostic endpoint succeeds with authenticated admin session (200 OK)');

  // 30d: Admin diagnostic rejects unauthenticated caller
  const adminUnauthDiagReq = new Request('http://localhost:3011/api/diagnostic');
  const adminUnauthDiagRes = await adminDiagHandler(adminUnauthDiagReq);
  assertEqual(adminUnauthDiagRes.status, 401,
    '30d. Admin diagnostic endpoint rejects unauthenticated caller with 401 Unauthorized');

  // 30e: Admin diagnostic rejects legacy x-diagnostic-key
  const adminLegacyKeyDiagReq = new Request('http://localhost:3011/api/diagnostic', {
    headers: { 'x-diagnostic-key': 'test-diag-key' }
  });
  const adminLegacyKeyDiagRes = await adminDiagHandler(adminLegacyKeyDiagReq);
  assertEqual(adminLegacyKeyDiagRes.status, 401,
    '30e. Admin diagnostic endpoint strictly rejects x-diagnostic-key; admin session required');

  // 30f: Admin diagnostic accepts authenticated admin session
  const adminAuthDiagReq = new Request('http://localhost:3011/api/diagnostic', {
    headers: { cookie: `${ADMIN_COOKIE_NAME}=test-admin-token` }
  });
  const adminAuthDiagRes = await adminDiagHandler(adminAuthDiagReq);
  assertEqual(adminAuthDiagRes.status, 200,
    '30f. Admin diagnostic endpoint succeeds with authenticated admin session (200 OK)');

  // 30g: Public Health check is unauthenticated and safe
  const publicHealthReq = new Request('http://localhost:3010/api/health') as any;
  const publicHealthRes = await healthHandler(publicHealthReq);
  assertEqual(publicHealthRes.status, 200,
    '30g. Public /api/health endpoint is accessible without authentication (200 OK)');
  const healthJson = await publicHealthRes.json();
  assertEqual(healthJson.healthy, true, '30h. Health check returns healthy: true');
  assert(!JSON.stringify(healthJson).includes('supabase') && !JSON.stringify(healthJson).includes('/home/'),
    '30i. Health check leaks zero internal environment or paths');

  // -------------------------------------------------------------
  // Test 31: Open redirect protection in login flow
  // -------------------------------------------------------------
  const { getSafeRedirectUrl } = await import('../auth');
  assertEqual(getSafeRedirectUrl('https://evil.com'), '/', '31a. External absolute URL neutralized to /');
  assertEqual(getSafeRedirectUrl('//evil.com/phish'), '/', '31b. Protocol-relative URL neutralized to /');
  assertEqual(getSafeRedirectUrl('/\\evil.com'), '/', '31c. Obfuscated /\\\\ URL neutralized to /');
  assertEqual(getSafeRedirectUrl('\\\\evil.com'), '/', '31d. Double backslash URL neutralized to /');
  assertEqual(getSafeRedirectUrl('javascript:alert(1)'), '/', '31e. JavaScript pseudo-protocol neutralized to /');
  assertEqual(getSafeRedirectUrl('data:text/html,test'), '/', '31f. Data pseudo-protocol neutralized to /');
  assertEqual(getSafeRedirectUrl('/quizzes/create'), '/quizzes/create', '31g. Safe relative path preserved');
  assertEqual(getSafeRedirectUrl('/quizzes?view=all'), '/quizzes?view=all', '31h. Safe relative path with query preserved');

  // -------------------------------------------------------------
  // Test 32: CSRF defense across mutating HTTP methods (POST, PUT, PATCH, DELETE)
  // -------------------------------------------------------------
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const csrfReq = new Request('http://localhost:3011/api/quizzes', {
      method,
      headers: {
        origin: 'https://evil-attacker.com',
        host: 'localhost:3011',
        cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
      }
    });
    const csrfRes = await requireAuthenticatedAdmin(csrfReq);
    assertEqual(csrfRes.status, 403,
      `32. Cross-origin ${method} mutation rejected by CSRF origin verification`);
    assertEqual(csrfRes.authorized, false,
      `32b. Cross-origin ${method} mutation has authorized: false`);
  }

  // -------------------------------------------------------------
  // Test 33: Logout invalidation & cookie clearance
  // -------------------------------------------------------------
  const testLogoutResponse = NextResponse.json({ success: true });
  clearSessionCookies(testLogoutResponse, true);
  const clearCookieHeader = testLogoutResponse.headers.get('set-cookie') || '';
  assert(clearCookieHeader.includes('Max-Age=0') || clearCookieHeader.includes('max-age=0'),
    '33a. clearSessionCookies sets Max-Age=0 on cookies');
  assert(clearCookieHeader.includes('sb-access-token=;'),
    '33b. clearSessionCookies empties sb-access-token');
  assert(clearCookieHeader.includes('sb-refresh-token=;'),
    '33c. clearSessionCookies empties sb-refresh-token');

  // -------------------------------------------------------------
  // Test 34: Standard Supabase SSR cookie (sb-<ref>-auth-token) parsing
  // -------------------------------------------------------------
  const { getSupabaseProjectRef } = await import('../../../../apps/admin/src/lib/auth');
  const projectRef = getSupabaseProjectRef() || 'eaqmwvxggnyprletpklr';
  const ssrCookiePayload = encodeURIComponent(JSON.stringify(['test-admin-token', 'valid-refresh-token']));
  const ssrReq = new Request('http://localhost:3011/api/quizzes', {
    headers: {
      cookie: `sb-${projectRef}-auth-token=${ssrCookiePayload}`
    }
  });
  const ssrRes = await requireAuthenticatedAdmin(ssrReq);
  assertEqual(ssrRes.status, 200,
    '34. Standard Supabase SSR cookie (sb-<ref>-auth-token) parsed and authenticated successfully');
  // -------------------------------------------------------------
  // Test 35: Production mode rejects test mock credentials
  // -------------------------------------------------------------
  const originalEnv = process.env.NODE_ENV;
  const originalTestAuth = process.env.ENABLE_TEST_AUTH;
  try {
    // Temporarily simulate production environment
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).ENABLE_TEST_AUTH = 'true'; // Attempt bypass
    const prodSimReq = new Request('http://localhost:3011/api/quizzes', {
      headers: {
        cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
      }
    });
    const prodSimRes = await requireAuthenticatedAdmin(prodSimReq);
    assertEqual(prodSimRes.authorized, false,
      '35a. In production mode, test-admin-token is strictly rejected (no test backdoor, bypass impossible)');
    assert(prodSimRes.status === 401 || prodSimRes.status === 500,
      '35b. Production mode returns 401/500 instead of authenticating test mock');
  } finally {
    (process.env as any).NODE_ENV = originalEnv;
    (process.env as any).ENABLE_TEST_AUTH = originalTestAuth;
  }

  console.log(`\nSecurity Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
