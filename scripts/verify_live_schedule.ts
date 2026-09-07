import { saveQuiz, deleteQuiz } from '../packages/shared/src/dal/admin';
import { getSupabaseAdminClient } from '../packages/shared/src/supabase';
import type { Quiz } from '@quizmania/types';

const LOCAL_PUBLIC_URL = 'http://localhost:3010';

async function runLiveVerification() {
  console.log('====================================================');
  console.log('LIVE AVAILABILITY SCHEDULE & EXPIRY VERIFICATION');
  console.log('====================================================\n');

  const testQuizSlug = 'quizmania-schedule-test-2026';
  const testQuizTitle = 'QUIZMANIA SCHEDULE TEST 2026';
  const testQuizId = '00000000-0000-4000-a000-000000000999';

  // 1. Initial cleanup
  console.log('[Step 1] Initial cleanup of any previous test quiz...');
  try {
    await deleteQuiz(testQuizId);
  } catch {}

  try {
    // 2. Create Base Published Quiz in live storage
    console.log('\n[Step 2] Creating "QUIZMANIA SCHEDULE TEST 2026" with questions & options...');
    const now = Date.now();
    const futureStart = new Date(now + 15 * 60 * 1000).toISOString();
    const futureEnd = new Date(now + 120 * 60 * 1000).toISOString();

    const quiz: Quiz = {
      id: testQuizId,
      title: testQuizTitle,
      slug: testQuizSlug,
      description: 'Verifying availability schedule transitions and attempt timer independence',
      status: 'published',
      instructions: 'Answer all questions carefully.',
      cover_image: null,
      theme_id: null,
      start_at: futureStart,
      end_at: futureEnd,
      settings: {
        time_limit_minutes: 15,
        schedule_enabled: true,
        start_at: futureStart,
        end_at: futureEnd,
        passing_score_percentage: 50,
        show_score_immediately: true
      },
      questions: [
        {
          id: '00000000-0000-4000-a000-000000000888',
          quiz_id: testQuizId,
          question_text: 'What is the capital of Goa?',
          question_type: 'single_choice',
          marks: 10,
          required: true,
          question_order: 1,
          options: [
            {
              id: '00000000-0000-4000-a000-000000000777',
              question_id: '00000000-0000-4000-a000-000000000888',
              option_text: 'Panaji',
              option_image: null,
              is_correct: true,
              option_order: 1
            },
            {
              id: '00000000-0000-4000-a000-000000000778',
              question_id: '00000000-0000-4000-a000-000000000888',
              option_text: 'Margao',
              option_image: null,
              is_correct: false,
              option_order: 2
            }
          ]
        }
      ]
    };

    const savedQuiz = await saveQuiz(quiz);
    console.log(`✓ Saved quiz: "${savedQuiz.title}" (Status: ${savedQuiz.status}, Availability: ${savedQuiz.availability?.status})`);

    // -----------------------------------------------------------------
    // TRANSITION 1: UPCOMING
    // -----------------------------------------------------------------
    console.log('\n--- TRANSITION 1: Upcoming Schedule Verification ---');
    const getRes1 = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}`, { cache: 'no-store' });
    const getData1 = await getRes1.json();
    console.log(`GET /api/quizzes/${testQuizSlug} -> HTTP ${getRes1.status}`);
    console.log(`Availability status: "${getData1.quiz?.availability?.status}", isAvailable: ${getData1.quiz?.availability?.isAvailable}`);
    if (getData1.quiz?.availability?.status !== 'upcoming' || getData1.quiz?.availability?.isAvailable !== false) {
      throw new Error(`Expected availability status 'upcoming' with isAvailable false, got ${getData1.quiz?.availability?.status}`);
    }

    // Try starting an attempt when upcoming
    const startRes1 = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Upcoming Participant' })
    });
    const startData1 = await startRes1.json();
    console.log(`POST /api/quizzes/${testQuizSlug}/start -> HTTP ${startRes1.status} (expected 409)`);
    console.log(`Response error/status:`, startData1.status, startData1.message);
    if (startRes1.status !== 409 || startData1.status !== 'upcoming') {
      throw new Error(`Expected HTTP 409 with status 'upcoming' when starting upcoming quiz`);
    }
    console.log('✓ Transition 1 (Upcoming -> 409 rejection) verified successfully.');

    // -----------------------------------------------------------------
    // TRANSITION 2: LIVE
    // -----------------------------------------------------------------
    console.log('\n--- TRANSITION 2: Live Schedule Verification ---');
    const pastStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const liveEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await saveQuiz({
      ...savedQuiz,
      start_at: pastStart,
      end_at: liveEnd,
      settings: {
        ...savedQuiz.settings,
        start_at: pastStart,
        end_at: liveEnd
      }
    });

    const getRes2 = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}`, { cache: 'no-store' });
    const getData2 = await getRes2.json();
    console.log(`GET /api/quizzes/${testQuizSlug} -> HTTP ${getRes2.status}`);
    console.log(`Availability status: "${getData2.quiz?.availability?.status}", isAvailable: ${getData2.quiz?.availability?.isAvailable}`);
    if (getData2.quiz?.availability?.status !== 'live' || getData2.quiz?.availability?.isAvailable !== true) {
      throw new Error(`Expected availability status 'live' with isAvailable true, got ${getData2.quiz?.availability?.status}`);
    }

    // Start in-flight attempt during live window
    const startRes2 = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Live In-Flight Participant' })
    });
    const startData2 = await startRes2.json();
    console.log(`POST /api/quizzes/${testQuizSlug}/start -> HTTP ${startRes2.status} (expected 200)`);
    console.log(`Created attempt: ${startData2.attemptId}, sessionToken: ${startData2.sessionToken}`);
    if (startRes2.status !== 200 || !startData2.sessionToken || !startData2.attemptId) {
      throw new Error(`Expected HTTP 200 with attemptId and sessionToken`);
    }

    const inFlightAttemptId = startData2.attemptId;
    const inFlightSessionToken = startData2.sessionToken;
    console.log('✓ Transition 2 (Live -> 200 attempt start) verified successfully.');

    // -----------------------------------------------------------------
    // TRANSITION 3: EXPIRED
    // -----------------------------------------------------------------
    console.log('\n--- TRANSITION 3: Expired Schedule Verification ---');
    const expStart = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    const expEnd = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    await saveQuiz({
      ...savedQuiz,
      start_at: expStart,
      end_at: expEnd,
      settings: {
        ...savedQuiz.settings,
        start_at: expStart,
        end_at: expEnd
      }
    });

    const getRes3 = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}`, { cache: 'no-store' });
    const getData3 = await getRes3.json();
    console.log(`GET /api/quizzes/${testQuizSlug} -> HTTP ${getRes3.status}`);
    console.log(`Availability status: "${getData3.quiz?.availability?.status}", isAvailable: ${getData3.quiz?.availability?.isAvailable}`);
    if (getData3.quiz?.availability?.status !== 'expired' || getData3.quiz?.availability?.isAvailable !== false) {
      throw new Error(`Expected availability status 'expired' with isAvailable false, got ${getData3.quiz?.availability?.status}`);
    }

    // Try starting a NEW attempt when expired
    const startRes3 = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_name: 'Late Participant' })
    });
    const startData3 = await startRes3.json();
    console.log(`POST /api/quizzes/${testQuizSlug}/start -> HTTP ${startRes3.status} (expected 410)`);
    console.log(`Response error/status:`, startData3.status, startData3.message);
    if (startRes3.status !== 410 || startData3.status !== 'expired') {
      throw new Error(`Expected HTTP 410 with status 'expired' when starting expired quiz`);
    }
    console.log('✓ Transition 3 (Expired -> 410 rejection) verified successfully.');

    // -----------------------------------------------------------------
    // INVARIANT: In-flight attempt started in Transition 2 submits AFTER
    // window expired (governed by attempt timer, NOT availability window)
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT: In-Flight Attempt Submits After Window Expired ---');
    const submitRes = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: inFlightAttemptId,
        sessionToken: inFlightSessionToken,
        participant: { name: 'Live In-Flight Participant' },
        answers: [
          {
            questionId: '00000000-0000-4000-a000-000000000888',
            selectedOptionId: '00000000-0000-4000-a000-000000000777' // Panaji (Correct)
          }
        ]
      })
    });
    const submitData = await submitRes.json();
    console.log(`POST /api/quizzes/${testQuizSlug}/submit -> HTTP ${submitRes.status}`);
    console.log(`Submission result: Score ${submitData.result?.score}/${submitData.result?.totalPossibleMarks}, Percentage: ${submitData.result?.percentage}%, Passed: ${submitData.result?.passed}`);
    if (submitRes.status !== 200 || !submitData.success || submitData.result?.score !== 10) {
      throw new Error(`In-flight attempt failed to submit after availability window expired`);
    }
    console.log('✓ Invariant verified: In-flight attempt completed successfully after window closed.');

    // -----------------------------------------------------------------
    // INVARIANT: Attempt Timer Expiry Enforcement
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT: Expired Attempt Timer Rejection ---');
    // Direct attempt record with expired attempt timer
    const supabase = getSupabaseAdminClient();
    const expiredTimerToken = `tok-expired-${Date.now()}`;
    const expiredAttemptId = '00000000-0000-4000-a000-000000000555';

    if (supabase) {
      await supabase.from('quiz_attempts').insert({
        id: expiredAttemptId,
        quiz_id: testQuizId,
        session_token: expiredTimerToken,
        participant_name: 'Expired Attempt Timer Participant',
        started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // expired 5 mins ago
        status: 'in_progress'
      });
    }

    const expSubmitRes = await fetch(`${LOCAL_PUBLIC_URL}/api/quizzes/${testQuizSlug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: expiredAttemptId,
        sessionToken: expiredTimerToken,
        participant: { name: 'Expired Attempt Timer Participant' },
        answers: [
          {
            questionId: '00000000-0000-4000-a000-000000000888',
            selectedOptionId: '00000000-0000-4000-a000-000000000777'
          }
        ]
      })
    });
    const expSubmitData = await expSubmitRes.json();
    console.log(`POST /api/quizzes/${testQuizSlug}/submit (expired timer) -> HTTP ${expSubmitRes.status}, error: "${expSubmitData.error}"`);
    if (expSubmitRes.status !== 400 || !expSubmitData.error?.includes('Time expired')) {
      throw new Error(`Expected HTTP 400 with 'Time expired' error message`);
    }
    console.log('✓ Attempt timer expiration correctly rejected attempt independently of schedule window.');

    console.log('\n====================================================');
    console.log('ALL VERIFICATIONS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } finally {
    console.log('\n[Step 4] Cleaning up test quiz from live Supabase...');
    await deleteQuiz(testQuizId);
    console.log('✓ Cleaned up "QUIZMANIA SCHEDULE TEST 2026".');
  }
}

runLiveVerification().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
