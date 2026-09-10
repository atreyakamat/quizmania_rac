process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_STORE = 'true';

import { test } from 'node:test';
import assert from 'node:assert';
import { POST as startPost } from '../[slug]/start/route';
import { mockStore, createQaFixtureQuiz, saveQuiz } from '@quizmania/shared';

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

  console.log('All public start route tests completed successfully.');
}

runStartRouteTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
