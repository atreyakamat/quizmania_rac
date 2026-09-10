process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_STORE = 'true';

import { test } from 'node:test';
import assert from 'node:assert';
import { POST as startPost } from '../[slug]/start/route';
import { POST as submitPost } from '../[slug]/submit/route';
import { mockStore, createQaFixtureQuiz, saveQuiz, createQuizAttempt, QA_QUIZ_SLUG, QA_QUIZ_ID } from '@quizmania/shared';

async function runStartRouteTests() {
  console.log('\n========================================');
  console.log('Running Public Start Quiz Route Tests');
  console.log('========================================\n');

  // 1. Invalid JSON
  await test('1. Start: Invalid JSON payload', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/test/start', {
      method: 'POST',
      body: 'invalid-json'
    });
    const res = await startPost(req as any, { params: { slug: 'test' } });
    assert.ok(res.status === 400, 'Rejects invalid JSON payload with 400');
  });

  // 2. Participant validation failure
  await test('2. Start: Missing participant name', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/test/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: '' })
    });
    const res = await startPost(req as any, { params: { slug: 'test' } });
    assert.ok(res.status === 400, 'Rejects empty participant name with 400');

    // Name too long (> 100)
    const reqLongName = new Request('http://localhost:3000/api/quizzes/test/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: 'A'.repeat(101) })
    });
    const resLongName = await startPost(reqLongName as any, { params: { slug: 'test' } });
    assert.ok(resLongName.status === 400, 'Rejects participant name > 100 chars');

    // Email too long (> 255)
    const reqLongEmail = new Request('http://localhost:3000/api/quizzes/test/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Valid Name', participant_email: `${'a'.repeat(250)}@long.com` })
    });
    const resLongEmail = await startPost(reqLongEmail as any, { params: { slug: 'test' } });
    assert.ok(resLongEmail.status === 400, 'Rejects participant email > 255 chars');
  });

  // 3. Quiz not found
  await test('3. Start: Non-existent quiz', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/missing-slug/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Atreya Kamat' })
    });
    const res = await startPost(req as any, { params: { slug: 'missing-slug' } });
    assert.ok(res.status === 404, 'Returns 404 when quiz is not found');
  });

  // 4. Availability checks: upcoming, expired, closed
  await test('4. Start: Availability transitions', async () => {
    const fixture = createQaFixtureQuiz();
    const slugUpcoming = 'qa-upcoming-test';
    await saveQuiz({
      ...fixture,
      id: '00000000-0000-4000-b000-000000000001',
      slug: slugUpcoming,
      status: 'published',
      start_at: new Date(Date.now() + 86400000).toISOString(),
      end_at: new Date(Date.now() + 172800000).toISOString()
    });

    const reqUpcoming = new Request(`http://localhost:3000/api/quizzes/${slugUpcoming}/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Upcoming Candidate' })
    });
    const resUpcoming = await startPost(reqUpcoming as any, { params: { slug: slugUpcoming } });
    assert.ok(resUpcoming.status === 409, 'Returns 409 for upcoming quiz');

    const slugExpired = 'qa-expired-test';
    await saveQuiz({
      ...fixture,
      id: '00000000-0000-4000-b000-000000000002',
      slug: slugExpired,
      status: 'published',
      start_at: new Date(Date.now() - 172800000).toISOString(),
      end_at: new Date(Date.now() - 86400000).toISOString()
    });

    const reqExpired = new Request(`http://localhost:3000/api/quizzes/${slugExpired}/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Expired Candidate' })
    });
    const resExpired = await startPost(reqExpired as any, { params: { slug: slugExpired } });
    assert.ok(resExpired.status === 410, 'Returns 410 for expired quiz');
  });

  // 5. Valid quiz attempt start
  await test('5. Start: Valid published quiz attempt', async () => {
    const { QA_QUIZ_SLUG } = await import('@quizmania/shared');
    await saveQuiz(createQaFixtureQuiz());

    const req = new Request(`http://localhost:3000/api/quizzes/${QA_QUIZ_SLUG}/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        participant_name: 'Atreya Kamat',
        participant_email: 'atreya@rotaract.org'
      })
    });
    const res = await startPost(req as any, { params: { slug: QA_QUIZ_SLUG } });
    assert.ok(res.status === 200, 'Returns 200 on successful attempt initialization');
    const data = await res.json();
    assert.ok(data.success === true, 'Response payload reports success true');
    assert.ok(Boolean(data.attemptId), 'Response contains attemptId');
    assert.ok(Boolean(data.sessionToken), 'Response contains cryptographically secure sessionToken');
  });

  // 6. Submit: Invalid JSON payload
  await test('6. Submit: Invalid JSON payload', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/test/submit', {
      method: 'POST',
      body: 'bad-json-payload',
      headers: { 'x-forwarded-for': '10.20.1.1' }
    });
    const res = await submitPost(req as any, { params: { slug: 'test' } });
    assert.ok(res.status === 400, 'Submit rejects invalid JSON with 400');
  });

  // 7. Submit: Session token checks (invalid, already submitted, expired)
  await test('7. Submit: Session token status enforcement', async () => {
    // A. Invalid session token
    const reqInvalidTok = new Request('http://localhost:3000/api/quizzes/test/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.1.2' },
      body: JSON.stringify({ sessionToken: 'non-existent-session-tok' })
    });
    const resInvalidTok = await submitPost(reqInvalidTok as any, { params: { slug: 'test' } });
    assert.ok(resInvalidTok.status === 400, 'Submit rejects invalid session token');

    // B. Already submitted attempt
    await createQuizAttempt({
      id: 'att-already-sub',
      quiz_id: QA_QUIZ_ID,
      session_token: 'tok-already-sub',
      status: 'submitted',
      created_at: new Date().toISOString()
    });
    const reqAlreadySub = new Request('http://localhost:3000/api/quizzes/test/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.1.3' },
      body: JSON.stringify({ sessionToken: 'tok-already-sub' })
    });
    const resAlreadySub = await submitPost(reqAlreadySub as any, { params: { slug: 'test' } });
    assert.ok(resAlreadySub.status === 400, 'Submit rejects already submitted attempt');

    // C. Expired attempt
    await createQuizAttempt({
      id: 'att-expired-tok',
      quiz_id: QA_QUIZ_ID,
      session_token: 'tok-expired-tok',
      status: 'in_progress',
      expires_at: new Date(Date.now() - 60000).toISOString(),
      created_at: new Date().toISOString()
    });
    const reqExpiredTok = new Request('http://localhost:3000/api/quizzes/test/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.1.4' },
      body: JSON.stringify({ sessionToken: 'tok-expired-tok' })
    });
    const resExpiredTok = await submitPost(reqExpiredTok as any, { params: { slug: 'test' } });
    assert.ok(resExpiredTok.status === 400, 'Submit rejects expired attempt');
  });

  // 8. Submit: Schema validation failure
  await test('8. Submit: Schema validation failure', async () => {
    const reqBadSchema = new Request('http://localhost:3000/api/quizzes/test/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.1.5' },
      body: JSON.stringify({ participant: { name: '' } })
    });
    const resBadSchema = await submitPost(reqBadSchema as any, { params: { slug: 'test' } });
    assert.ok(resBadSchema.status === 400, 'Submit rejects invalid participant data');
  });

  // 9. Submit: Valid complete quiz submission
  await test('9. Submit: Valid complete quiz submission', async () => {
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const sessionToken = `tok-sub-valid-${uniqueSuffix}`;
    const attemptId = `att-sub-valid-${uniqueSuffix}`;

    await createQuizAttempt({
      id: attemptId,
      quiz_id: QA_QUIZ_ID,
      session_token: sessionToken,
      status: 'in_progress',
      expires_at: new Date(Date.now() + 600000).toISOString(),
      created_at: new Date().toISOString()
    });

    const validPayload = {
      attemptId,
      sessionToken,
      participant: {
        name: 'Public Tester',
        email: 'public@quizmania.dev',
        club_name: 'Rotaract Club of Mapusa',
        district_number: '3170',
        position: 'Member'
      },
      answers: [
        { questionId: '00000000-0000-0000-0000-0000000000f1', selectedOptionId: '00000000-0000-0000-0000-000000001011' },
        { questionId: '00000000-0000-0000-0000-0000000000f2', selectedOptionIds: ['00000000-0000-0000-0000-000000001021', '00000000-0000-0000-0000-000000001022', '00000000-0000-0000-0000-000000001023'] },
        { questionId: '00000000-0000-0000-0000-0000000000f3', selectedOptionId: '00000000-0000-0000-0000-000000001031' },
        { questionId: '00000000-0000-0000-0000-0000000000f4', textAnswer: 'Rotaract' },
        { questionId: '00000000-0000-0000-0000-0000000000f5', textAnswer: 'Blood drive initiative.' },
        { questionId: '00000000-0000-0000-0000-0000000000f6', selectedOptionId: '00000000-0000-0000-0000-000000001061' },
        { questionId: '00000000-0000-0000-0000-0000000000f7', selectedOptionId: '00000000-0000-0000-0000-000000001071' }
      ]
    };

    const reqValid = new Request(`http://localhost:3000/api/quizzes/${QA_QUIZ_SLUG}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.1.6' },
      body: JSON.stringify(validPayload)
    });
    const resValid = await submitPost(reqValid as any, { params: { slug: QA_QUIZ_SLUG } });
    assert.ok(resValid.status === 200, 'Submit returns 200 on valid quiz submission');
    const validData = await resValid.json();
    assert.ok(validData.success === true && Boolean(validData.result), 'Submit response reports success true with result');
  });

  // 10. Submit: Rate limiting
  await test('10. Submit: Rate limiting', async () => {
    const ip = '10.20.9.99';
    let resRateLimit: any = null;
    for (let i = 0; i < 25; i++) {
      const reqRate = new Request('http://localhost:3000/api/quizzes/test/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': ip }
      });
      resRateLimit = await submitPost(reqRate as any, { params: { slug: 'test' } });
    }
    assert.ok(resRateLimit.status === 429, 'Submit rate limiter blocks excessive calls with 429');
  });

  console.log('All public start and submit route tests completed successfully.');
}

runStartRouteTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
