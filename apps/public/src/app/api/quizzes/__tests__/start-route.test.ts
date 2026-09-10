process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_STORE = 'true';

import { test } from 'node:test';
import { POST as startPost } from '../[slug]/start/route';
import { mockStore, setQuizStatus } from '@quizmania/shared';

async function runStartRouteTests() {
  console.log('\n========================================');
  console.log('Running Public Start Quiz Route Tests');
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

  // 1. Invalid JSON
  await test('1. Start: Invalid JSON payload', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/test/start', {
      method: 'POST',
      body: 'invalid-json'
    });
    const res = await startPost(req as any, { params: { slug: 'test' } });
    assert(res.status === 400, 'Rejects invalid JSON payload with 400');
  });

  // 2. Participant validation failure
  await test('2. Start: Missing participant name', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/test/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: '' })
    });
    const res = await startPost(req as any, { params: { slug: 'test' } });
    assert(res.status === 400, 'Rejects empty participant name with 400');
  });

  // 3. Quiz not found
  await test('3. Start: Non-existent quiz', async () => {
    const req = new Request('http://localhost:3000/api/quizzes/missing-slug/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Atreya Kamat' })
    });
    const res = await startPost(req as any, { params: { slug: 'missing-slug' } });
    assert(res.status === 404, 'Returns 404 when quiz is not found');
  });

  // 4. Valid quiz attempt start
  await test('4. Start: Valid published quiz attempt', async () => {
    // Ensure test quiz is published in mock store
    const { QA_QUIZ_SLUG, createQaFixtureQuiz, saveQuiz } = await import('@quizmania/shared');
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
    assert(res.status === 200, 'Returns 200 on successful attempt initialization');
    const data = await res.json();
    assert(data.success === true, 'Response payload reports success true');
    assert(Boolean(data.attemptId), 'Response contains attemptId');
    assert(Boolean(data.sessionToken), 'Response contains cryptographically secure sessionToken');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStartRouteTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
