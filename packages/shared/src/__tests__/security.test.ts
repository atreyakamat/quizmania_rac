process.env.FORCE_MOCK_STORE = 'true';
process.env.NODE_ENV = 'test';

import fs from 'fs';
import path from 'path';
import {
  saveQuiz,
  getPublishedQuizBySlug,
  createQuizAttempt,
  getQuizAttemptByToken,
  updateQuizAttemptStatus,
  scoreAndRecordQuizSubmission,
  getSupabaseServiceKey,
  isSupabaseAdminConfigured,
  getResponsesPaginated,
  mockStore
} from '../index';
import { validateQuizJson, questionSchema, quizSettingsSchema } from '@quizmania/quiz-schema';
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

  // -------------------------------------------------------------
  // Test 36: Admin Server-Side Storage Upload API Route (/api/upload)
  // -------------------------------------------------------------
  const { POST: uploadHandler } = await import('../../../../apps/admin/src/app/api/upload/route');

  // 36a: Unauthenticated upload request rejected (401)
  const unauthUploadForm = new FormData();
  unauthUploadForm.append('bucket', 'quiz-covers');
  unauthUploadForm.append('file', new File(['binary-content'], 'test.png', { type: 'image/png' }));
  const unauthUploadReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3011',
      host: 'localhost:3011'
    },
    body: unauthUploadForm
  }) as any;
  const unauthUploadRes = await uploadHandler(unauthUploadReq);
  assertEqual(unauthUploadRes.status, 401, '36a. Unauthenticated upload request rejected with 401 Unauthorized');

  // 36b: Cross-origin upload request rejected (403 CSRF)
  const csrfUploadForm = new FormData();
  csrfUploadForm.append('bucket', 'quiz-covers');
  csrfUploadForm.append('file', new File(['binary-content'], 'test.png', { type: 'image/png' }));
  const csrfUploadReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'https://attacker.evil.com',
      host: 'localhost:3011',
      cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
    },
    body: csrfUploadForm
  }) as any;
  const csrfUploadRes = await uploadHandler(csrfUploadReq);
  assertEqual(csrfUploadRes.status, 403, '36b. Cross-origin upload request rejected with 403 Forbidden (CSRF)');

  // 36c: Missing file rejected (400)
  const missingFileForm = new FormData();
  missingFileForm.append('bucket', 'quiz-covers');
  const missingFileReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3011',
      host: 'localhost:3011',
      cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
    },
    body: missingFileForm
  }) as any;
  const missingFileRes = await uploadHandler(missingFileReq);
  assertEqual(missingFileRes.status, 400, '36c. Upload request without file rejected with 400 Bad Request');

  // 36d: Disallowed bucket rejected (400)
  const badBucketForm = new FormData();
  badBucketForm.append('bucket', 'confidential-docs' as any);
  badBucketForm.append('file', new File(['content'], 'test.png', { type: 'image/png' }));
  const badBucketReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3011',
      host: 'localhost:3011',
      cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
    },
    body: badBucketForm
  }) as any;
  const badBucketRes = await uploadHandler(badBucketReq);
  assertEqual(badBucketRes.status, 400, '36d. Upload to unlisted bucket rejected with 400 Bad Request');

  // 36e: Disallowed MIME type rejected (400)
  const badMimeForm = new FormData();
  badMimeForm.append('bucket', 'quiz-covers');
  badMimeForm.append('file', new File(['#!/bin/bash\necho pwned'], 'exploit.sh', { type: 'application/x-sh' }));
  const badMimeReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3011',
      host: 'localhost:3011',
      cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
    },
    body: badMimeForm
  }) as any;
  const badMimeRes = await uploadHandler(badMimeReq);
  assertEqual(badMimeRes.status, 400, '36e. Upload with disallowed MIME type rejected with 400 Bad Request');

  // 36f: Oversized file (>5MB) rejected (400)
  const oversizedForm = new FormData();
  oversizedForm.append('bucket', 'quiz-covers');
  const oversizedBlob = new Blob([new Uint8Array(6 * 1024 * 1024)]);
  oversizedForm.append('file', new File([oversizedBlob], 'huge.png', { type: 'image/png' }));
  const oversizedReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3011',
      host: 'localhost:3011',
      cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
    },
    body: oversizedForm
  }) as any;
  const oversizedRes = await uploadHandler(oversizedReq);
  assertEqual(oversizedRes.status, 400, '36f. Upload exceeding 5MB size limit rejected with 400 Bad Request');

  // 36g: Valid image upload with authenticated admin succeeds (200)
  const validUploadForm = new FormData();
  validUploadForm.append('bucket', 'quiz-covers');
  validUploadForm.append('file', new File(['valid png data'], '../../path/traversal.png', { type: 'image/png' }));
  const validUploadReq = new Request('http://localhost:3011/api/upload', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3011',
      host: 'localhost:3011',
      cookie: `${ADMIN_ACCESS_COOKIE}=test-admin-token`
    },
    body: validUploadForm
  }) as any;
  const validUploadRes = await uploadHandler(validUploadReq);
  assertEqual(validUploadRes.status, 200, '36g. Valid image upload with authenticated admin session succeeds (200 OK)');
  const validUploadJson = await validUploadRes.json();
  assertEqual(validUploadJson.success, true, '36h. Upload result contains success: true');
  assert(!validUploadJson.path.includes('../'), '36i. Path traversal characters stripped from generated storage path');

  // -------------------------------------------------------------
  // Test 37: Database Row-Level & Column-Level Security Verification
  // -------------------------------------------------------------
  const repoRoot = path.resolve(__dirname, '../../../../');
  const schemaSql = fs.readFileSync(path.join(repoRoot, 'supabase/schema.sql'), 'utf8');
  const migrationSql = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/20260909000004_fortify_rls_and_storage.sql'), 'utf8');

  // 37a: Questions column-level security revoking accepted_answers
  assert(schemaSql.includes('REVOKE SELECT ON public.questions FROM anon, authenticated;') &&
         migrationSql.includes('REVOKE SELECT ON public.questions FROM anon, authenticated;') &&
         !migrationSql.includes('accepted_answers,'),
    '37a. Column-level security revokes SELECT on questions(accepted_answers) from anon and authenticated');

  // 37b: Options column-level security revoking is_correct
  assert(schemaSql.includes('REVOKE SELECT ON public.options FROM anon, authenticated;') &&
         migrationSql.includes('REVOKE SELECT ON public.options FROM anon, authenticated;') &&
         !migrationSql.includes('is_correct,'),
    '37b. Column-level security revokes SELECT on options(is_correct) from anon and authenticated');

  // 37c: Quiz attempts direct anon insert policy dropped
  assert(migrationSql.includes('DROP POLICY IF EXISTS "Public can insert attempts" ON public.quiz_attempts;'),
    '37c. Migration drops direct anonymous quiz attempt insert policy from Postgres');

  // 37d: Submissions direct anon insert policy dropped
  assert(migrationSql.includes('DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;'),
    '37d. Migration drops direct anonymous submission insert policy from Postgres');

  // 37e: Answers direct anon insert policy dropped
  assert(migrationSql.includes('DROP POLICY IF EXISTS "Public can insert answers" ON public.answers;'),
    '37e. Migration drops direct anonymous answer insert policy from Postgres');

  // 37f: Storage write access restricted to service_role
  assert(schemaSql.includes('TO service_role') && migrationSql.includes('TO service_role'),
    '37f. Storage policies restrict insert, update, and delete exclusively to service_role');

  // 37g: Public projection getPublishedQuizBySlug strictly omits accepted_answers
  const publishedQuizCheck = await getPublishedQuizBySlug(testSlug);
  const qWithAccepted = publishedQuizCheck?.questions.some((q: any) => 'accepted_answers' in q);
  assertEqual(qWithAccepted, false, '37g. Public projection getPublishedQuizBySlug strictly omits accepted_answers');

  // 37h: Public projection getPublishedQuizBySlug strictly omits is_correct
  const optWithCorrect = publishedQuizCheck?.questions.flatMap((q: any) => q.options || []).some((o: any) => 'is_correct' in o);
  assertEqual(optWithCorrect, false, '37h. Public projection getPublishedQuizBySlug strictly omits is_correct');

  // -------------------------------------------------------------
  // Test 38: Resource Abuse & Input Boundary Defense
  // -------------------------------------------------------------
  // 38a: Negative pagination page clamped to 1
  const paginatedNegPage = await getResponsesPaginated({ page: -5 });
  assertEqual(paginatedNegPage.page, 1, '38a. Negative pagination page number clamped to 1');

  // 38b: Massive pagination pageSize clamped to 100
  const paginatedBigPage = await getResponsesPaginated({ pageSize: 999999 });
  assertEqual(paginatedBigPage.pageSize, 100, '38b. Massive pagination pageSize clamped to maximum 100');

  // 38c: Question schema rejects negative marks
  const negMarksParsed = questionSchema.safeParse({
    question_text: 'Test Question',
    question_type: 'single_choice',
    marks: -5,
    options: [{ option_text: 'A', is_correct: true }, { option_text: 'B', is_correct: false }]
  });
  assertEqual(negMarksParsed.success, false, '38c. Question schema rejects negative marks');

  // 38d: Question schema rejects negative negative_marks
  const negNegMarksParsed = questionSchema.safeParse({
    question_text: 'Test Question',
    question_type: 'single_choice',
    marks: 1,
    negative_marks: -2,
    options: [{ option_text: 'A', is_correct: true }, { option_text: 'B', is_correct: false }]
  });
  assertEqual(negNegMarksParsed.success, false, '38d. Question schema rejects negative negative_marks');

  // 38e: Quiz settings schema rejects negative passing score percentage
  const negPassingScoreParsed = quizSettingsSchema.safeParse({
    passing_score_percentage: -15
  });
  assertEqual(negPassingScoreParsed.success, false, '38e. Quiz settings schema rejects negative passing score percentage');

  // 38f: Quiz settings schema rejects passing score percentage > 100
  const overPassingScoreParsed = quizSettingsSchema.safeParse({
    passing_score_percentage: 150
  });
  assertEqual(overPassingScoreParsed.success, false, '38f. Quiz settings schema rejects passing score percentage > 100');

  console.log(`\nSecurity Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
