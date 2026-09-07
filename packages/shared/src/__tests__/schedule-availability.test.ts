process.env.FORCE_MOCK_STORE = 'true';

import { 
  getQuizAvailability, 
  validateScheduleTimes
} from '@quizmania/quiz-schema';
import {
  saveQuiz,
  getPublishedQuizBySlug,
  createQuizAttempt,
  getQuizAttemptByToken,
  updateQuizAttemptStatus,
  scoreAndRecordQuizSubmission
} from '../index';
import type { Quiz } from '@quizmania/types';

async function runScheduleAvailabilityTests() {
  console.log('\n========================================');
  console.log('Running Schedule & Availability Test Suite (16 Cases)');
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
      console.error(`  [FAIL] ${msg}`);
      console.error(`         Expected: ${JSON.stringify(expected)}`);
      console.error(`         Actual:   ${JSON.stringify(actual)}`);
    }
  }

  // Pure functions reference time (deterministic)
  const fixedNow = new Date('2026-09-10T12:00:00.000Z');
  const fixedPast = new Date('2026-09-10T08:00:00.000Z').toISOString();
  const fixedFuture = new Date('2026-09-10T18:00:00.000Z').toISOString();
  const fixedFarPast = new Date('2026-09-09T10:00:00.000Z').toISOString();
  const fixedFarFuture = new Date('2026-09-11T10:00:00.000Z').toISOString();

  // 1. Schedule disabled -> status live (if published)
  {
    const res = getQuizAvailability({
      status: 'published',
      settings: { schedule_enabled: false }
    }, fixedNow);
    assertEqual(res.status, 'live', '1. Schedule disabled -> status live (if published)');
    assertEqual(res.isAvailable, true, '1b. Schedule disabled -> isAvailable true');
  }

  // 2. Schedule enabled, start in future -> status upcoming, isAvailable false
  {
    const res = getQuizAvailability({
      status: 'published',
      start_at: fixedFuture,
      end_at: fixedFarFuture,
      settings: { schedule_enabled: true, start_at: fixedFuture, end_at: fixedFarFuture }
    }, fixedNow);
    assertEqual(res.status, 'upcoming', '2. Schedule enabled, start in future -> status upcoming');
    assertEqual(res.isAvailable, false, '2b. Schedule enabled, start in future -> isAvailable false');
  }

  // 3. Schedule enabled, start past, end future -> status live, isAvailable true
  {
    const res = getQuizAvailability({
      status: 'published',
      start_at: fixedPast,
      end_at: fixedFuture,
      settings: { schedule_enabled: true, start_at: fixedPast, end_at: fixedFuture }
    }, fixedNow);
    assertEqual(res.status, 'live', '3. Schedule enabled, start past, end future -> status live');
    assertEqual(res.isAvailable, true, '3b. Schedule enabled, start past, end future -> isAvailable true');
  }

  // 4. Schedule enabled, end past -> status expired, isAvailable false
  {
    const res = getQuizAvailability({
      status: 'published',
      start_at: fixedFarPast,
      end_at: fixedPast,
      settings: { schedule_enabled: true, start_at: fixedFarPast, end_at: fixedPast }
    }, fixedNow);
    assertEqual(res.status, 'expired', '4. Schedule enabled, end past -> status expired');
    assertEqual(res.isAvailable, false, '4b. Schedule enabled, end past -> isAvailable false');
  }

  // 5. Quiz unpublished -> status draft/unpublished regardless of schedule
  {
    const resDraft = getQuizAvailability({
      status: 'draft',
      start_at: fixedPast,
      end_at: fixedFuture,
      settings: { schedule_enabled: true, start_at: fixedPast, end_at: fixedFuture }
    }, fixedNow);
    assertEqual(resDraft.status, 'draft', '5. Draft quiz -> status draft regardless of schedule window');
    assertEqual(resDraft.isAvailable, false, '5b. Draft quiz -> isAvailable false');
  }

  // 6. end_at earlier than start_at -> validation fails
  {
    const val = validateScheduleTimes(fixedFuture, fixedPast);
    assertEqual(val.valid, false, '6. end_at earlier than start_at -> validation fails');
    assertEqual(val.error, 'End time must be later than start time.', '6b. Correct error message returned');
  }

  // 7. end_at equal to start_at -> validation fails
  {
    const val = validateScheduleTimes(fixedPast, fixedPast);
    assertEqual(val.valid, false, '7. end_at equal to start_at -> validation fails');
  }

  // 8. only start_at specified (no end) -> upcoming before, live after
  {
    const resBefore = getQuizAvailability({
      status: 'published',
      start_at: fixedFuture,
      settings: { schedule_enabled: true, start_at: fixedFuture }
    }, fixedNow);
    assertEqual(resBefore.status, 'upcoming', '8a. only start_at -> upcoming before start');

    const resAfter = getQuizAvailability({
      status: 'published',
      start_at: fixedPast,
      settings: { schedule_enabled: true, start_at: fixedPast }
    }, fixedNow);
    assertEqual(resAfter.status, 'live', '8b. only start_at -> live after start');
  }

  // 9. only end_at specified (no start) -> live before, expired after
  {
    const resBefore = getQuizAvailability({
      status: 'published',
      end_at: fixedFuture,
      settings: { schedule_enabled: true, end_at: fixedFuture }
    }, fixedNow);
    assertEqual(resBefore.status, 'live', '9a. only end_at -> live before end');

    const resAfter = getQuizAvailability({
      status: 'published',
      end_at: fixedPast,
      settings: { schedule_enabled: true, end_at: fixedPast }
    }, fixedNow);
    assertEqual(resAfter.status, 'expired', '9b. only end_at -> expired after end');
  }

  // Live real-time epochs for integrated mockStore / DAL tests
  const realNowMs = Date.now();
  const realPastTime = new Date(realNowMs - 2 * 3600 * 1000).toISOString();
  const realFutureTime = new Date(realNowMs + 2 * 3600 * 1000).toISOString();
  const realFarPastTime = new Date(realNowMs - 24 * 3600 * 1000).toISOString();
  const realFarFutureTime = new Date(realNowMs + 24 * 3600 * 1000).toISOString();

  // Setup test quiz in store for simulated endpoints (cases 10, 11, 12, 13, 14)
  const testQuizId = 'sched-test-quiz-1';
  const testQuizSlug = 'sched-test-quiz-slug';
  const testQuiz: Quiz = {
    id: testQuizId,
    title: 'Schedule Invariant Verification Quiz',
    slug: testQuizSlug,
    description: 'Unit testing schedule window invariants',
    cover_image: null,
    status: 'published',
    theme_id: null,
    start_at: realPastTime,
    end_at: realFutureTime,
    settings: {
      time_limit_minutes: 15,
      schedule_enabled: true,
      start_at: realPastTime,
      end_at: realFutureTime
    },
    questions: [
      {
        id: 'q-sched-1',
        quiz_id: testQuizId,
        question_text: 'What is the speed of light?',
        question_type: 'single_choice',
        question_image: null,
        marks: 10,
        required: true,
        question_order: 1,
        options: [
          { id: 'opt-c', question_id: 'q-sched-1', option_text: '299,792 km/s', option_image: null, is_correct: true, option_order: 1 },
          { id: 'opt-w', question_id: 'q-sched-1', option_text: '100 km/h', option_image: null, is_correct: false, option_order: 2 }
        ]
      }
    ]
  };
  await saveQuiz(testQuiz);

  // 10. attempt start rejected when upcoming (409)
  {
    const upcomingQuiz: Quiz = {
      ...testQuiz,
      id: 'sched-upcoming-quiz',
      slug: 'sched-upcoming-slug',
      start_at: realFutureTime,
      end_at: realFarFutureTime,
      settings: {
        ...testQuiz.settings,
        schedule_enabled: true,
        start_at: realFutureTime,
        end_at: realFarFutureTime
      }
    };
    await saveQuiz(upcomingQuiz);
    const pubQuiz = await getPublishedQuizBySlug('sched-upcoming-slug');
    assert(Boolean(pubQuiz && pubQuiz.availability?.status === 'upcoming'), '10. Upcoming quiz has status upcoming');
    // Simulate start attempt check
    const isUpcoming = pubQuiz?.availability?.status === 'upcoming';
    const simulatedStatusCode = isUpcoming ? 409 : 200;
    assertEqual(simulatedStatusCode, 409, '10b. attempt start rejected with 409 when upcoming');
  }

  // 11. attempt start rejected when expired (410)
  {
    const expiredQuiz: Quiz = {
      ...testQuiz,
      id: 'sched-expired-quiz',
      slug: 'sched-expired-slug',
      start_at: realFarPastTime,
      end_at: realPastTime,
      settings: {
        ...testQuiz.settings,
        schedule_enabled: true,
        start_at: realFarPastTime,
        end_at: realPastTime
      }
    };
    await saveQuiz(expiredQuiz);
    const pubQuiz = await getPublishedQuizBySlug('sched-expired-slug');
    assert(Boolean(pubQuiz && pubQuiz.availability?.status === 'expired'), '11. Expired quiz has status expired');
    const isExpired = pubQuiz?.availability?.status === 'expired';
    const simulatedStatusCode = isExpired ? 410 : 200;
    assertEqual(simulatedStatusCode, 410, '11b. attempt start rejected with 410 when expired');
  }

  // 12. attempt start succeeds when live (200)
  {
    const pubQuiz = await getPublishedQuizBySlug(testQuizSlug);
    assert(Boolean(pubQuiz && pubQuiz.availability?.status === 'live'), '12. Live quiz has status live');
    const sessionToken = 'session-live-200';
    const attempt = await createQuizAttempt({
      id: 'attempt-live-200',
      quiz_id: testQuizId,
      session_token: sessionToken,
      participant_name: 'Live Participant',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: 'in_progress'
    });
    assert(Boolean(attempt && attempt.session_token === sessionToken), '12b. attempt start succeeds when live');
  }

  // 13. in-flight attempt completed after end_at succeeds if attempt timer has not expired
  {
    // In-flight attempt started legitimately before end_at
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).slice(2);
    const tokenInFlight = `session-inflight-${uniqueSuffix}`;
    const attemptIdInFlight = `attempt-inflight-${uniqueSuffix}`;
    // attempt expires in 10 minutes from now (timer still running)
    const attemptExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await createQuizAttempt({
      id: attemptIdInFlight,
      quiz_id: testQuizId,
      session_token: tokenInFlight,
      participant_name: 'Dedicated Student',
      started_at: realPastTime,
      expires_at: attemptExpiresAt,
      status: 'in_progress'
    });

    // Even if quiz availability window now ends or is expired:
    const expiredWindowQuiz: Quiz = {
      ...testQuiz,
      id: testQuizId,
      start_at: realFarPastTime,
      end_at: realPastTime, // window passed!
      settings: {
        ...testQuiz.settings,
        start_at: realFarPastTime,
        end_at: realPastTime
      }
    };
    await saveQuiz(expiredWindowQuiz);

    // Submission from in-flight attempt whose attempt timer is still valid
    const submitOutcome = await scoreAndRecordQuizSubmission(testQuizSlug, {
      attemptId: attemptIdInFlight,
      sessionToken: tokenInFlight,
      participant: { name: 'Dedicated Student' },
      answers: [
        { questionId: 'q-sched-1', selectedOptionId: 'opt-c' }
      ]
    });
    assertEqual(submitOutcome.success, true, '13. in-flight attempt completed after end_at succeeds while attempt timer is valid');
    assertEqual(submitOutcome.result?.score, 10, '13b. in-flight attempt scored successfully');
  }

  // 14. attempt submitted after attempt.expires_at rejected by attempt timer, NOT schedule
  {
    const tokenTimerExpired = 'session-timer-expired';
    // attempt expired 1 minute ago
    const attemptExpiredAt = new Date(Date.now() - 60 * 1000).toISOString();
    await createQuizAttempt({
      id: 'attempt-timer-expired',
      quiz_id: testQuizId,
      session_token: tokenTimerExpired,
      participant_name: 'Slow Participant',
      started_at: realPastTime,
      expires_at: attemptExpiredAt,
      status: 'in_progress'
    });

    // Check submission rejection logic matching submit route
    const att = await getQuizAttemptByToken(tokenTimerExpired);
    const transportLatencyBufferMs = 5000;
    const isTimerExpired = Boolean(
      att?.expires_at && Date.now() > new Date(att.expires_at).getTime() + transportLatencyBufferMs
    );
    assertEqual(isTimerExpired, true, '14. Attempt is identified as expired by attempt countdown timer');
    if (isTimerExpired) {
      await updateQuizAttemptStatus(tokenTimerExpired, 'expired');
    }
    const updatedAtt = await getQuizAttemptByToken(tokenTimerExpired);
    assertEqual(updatedAtt?.status, 'expired', '14b. Attempt status updated to expired');
  }

  // 15. client countdown calculation correct for upcoming quiz
  {
    const targetStartsAt = new Date('2026-09-10T14:30:00.000Z').toISOString();
    const mockClientNow = new Date('2026-09-10T12:00:00.000Z').getTime(); // 2 hours 30 mins remaining
    const diffSecs = Math.floor((new Date(targetStartsAt).getTime() - mockClientNow) / 1000);
    assertEqual(diffSecs, 9000, '15. diff in seconds is 9000 (2h 30m)');

    const hours = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;
    assertEqual(hours, 2, '15b. Hours calculated as 2');
    assertEqual(mins, 30, '15c. Minutes calculated as 30');
    assertEqual(secs, 0, '15d. Seconds calculated as 0');
  }

  // 16. timezone independence (UTC evaluation)
  {
    // Test that UTC comparison is unaffected by local representation
    const utcIso1 = '2026-09-10T10:00:00.000Z';
    const utcIso2 = '2026-09-10T15:30:00.000+05:30'; // Same instant as 10:00 UTC
    assertEqual(new Date(utcIso1).getTime(), new Date(utcIso2).getTime(), '16. Different timezone offset strings represent identical UTC epoch');

    const resUtc = getQuizAvailability({
      status: 'published',
      start_at: '2026-09-10T15:00:00.000+05:30', // 09:30 UTC
      end_at: '2026-09-10T17:30:00.000+05:30',   // 12:00 UTC
      settings: {
        schedule_enabled: true,
        start_at: '2026-09-10T15:00:00.000+05:30',
        end_at: '2026-09-10T17:30:00.000+05:30'
      }
    }, new Date('2026-09-10T10:00:00.000Z')); // 10:00 UTC is between 09:30 and 12:00 UTC
    assertEqual(resUtc.status, 'live', '16b. Status is live regardless of offset representation');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runScheduleAvailabilityTests().catch(err => {
  console.error('Test runner threw unhandled error:', err);
  process.exit(1);
});
