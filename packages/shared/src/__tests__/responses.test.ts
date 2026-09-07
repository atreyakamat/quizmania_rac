import { 
  mockStore, 
  getResponsesPaginated, 
  getResponseDetail, 
  updateManualGrade, 
  exportResponsesCsv,
  scoreAndRecordQuizSubmission
} from '../index';
import type { Quiz, QuizSubmissionPayload } from '@quizmania/types';

process.env.FORCE_MOCK_STORE = 'true';

export async function runResponseTests() {
  console.log('Running responses DAL tests...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${msg}`);
    } else {
      failed++;
      console.error(`[FAIL] ${msg}`);
    }
  }

  function assertEqual(actual: any, expected: any, msg: string) {
    if (actual === expected) {
      passed++;
      console.log(`[PASS] ${msg}`);
    } else {
      failed++;
      console.error(`[FAIL] ${msg}`);
      console.error(`  Expected: ${expected}`);
      console.error(`  Actual:   ${actual}`);
    }
  }

  const TEST_QUIZ: Quiz = {
    id: 'test-quiz-responses-001',
    title: 'Rotaract Knowledge Bowl',
    slug: 'rotaract-knowledge-bowl',
    description: 'Annual quiz for district 3170',
    cover_image: null,
    status: 'published',
    theme_id: null,
    settings: {
      passing_score_percentage: 60,
      features: { timer: false }
    },
    questions: [
      {
        id: 'q1-sc',
        quiz_id: 'test-quiz-responses-001',
        question_text: 'What year was RI District 3170 chartered?',
        question_type: 'single_choice',
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 1,
        question_image: null,
        options: [
          { id: 'opt-1a', question_id: 'q1-sc', option_text: '1970', is_correct: false, option_order: 1, option_image: null },
          { id: 'opt-1b', question_id: 'q1-sc', option_text: '1984', is_correct: true, option_order: 2, option_image: null },
          { id: 'opt-1c', question_id: 'q1-sc', option_text: '1990', is_correct: false, option_order: 3, option_image: null }
        ]
      },
      {
        id: 'q2-para',
        quiz_id: 'test-quiz-responses-001',
        question_text: 'Explain the community service mission of your club.',
        question_type: 'paragraph',
        marks: 5,
        required: false,
        question_order: 2,
        question_image: null
      }
    ]
  };

  mockStore.saveQuiz(TEST_QUIZ);
  mockStore.submissions = [];
  mockStore.answers = [];
  mockStore.syncToDisk();

  // Test 1: Submission and storage
  const payload1: QuizSubmissionPayload = {
    participant: {
      name: 'Jane Doe',
      email: 'jane@rotaractmapusa.org',
      club_name: 'Rotaract Club of Mapusa',
      district_number: '3170'
    },
    answers: [
      { questionId: 'q1-sc', selectedOptionId: 'opt-1b' }, // 5 marks
      { questionId: 'q2-para', textAnswer: 'We organize blood donation drives and youth literacy projects.' }
    ]
  };

  const outcome = await scoreAndRecordQuizSubmission(TEST_QUIZ.slug, payload1);
  if (!outcome.success) {
    console.error('Submission failed with error:', outcome.error);
  }
  assert(outcome.success, 'scoreAndRecordQuizSubmission succeeds');
  assertEqual(outcome.result?.score, 10, 'initial score is 10 (5 from Q1 + 5 from paragraph)');
  assertEqual(outcome.result?.percentage, 100, 'initial percentage is 100%');
  assertEqual(outcome.result?.passed, true, '100% is passed when passing threshold is 60%');
  assertEqual(mockStore.submissions.length, 1, 'submission added to mockStore');
  assertEqual(mockStore.answers.length, 2, 'answers recorded in mockStore');

  // Test 2: Paginated list and summary stats
  const payload2: QuizSubmissionPayload = {
    participant: { name: 'Bob Jones', email: 'bob@example.com' },
    answers: [{ questionId: 'q1-sc', selectedOptionId: 'opt-1a' }] // 0 marks, no paragraph
  };
  await scoreAndRecordQuizSubmission(TEST_QUIZ.slug, payload2);

  const paginated = await getResponsesPaginated({ page: 1, pageSize: 10 });
  assertEqual(paginated.total, 2, 'paginated total is 2');
  assertEqual(paginated.summary.totalResponses, 2, 'summary totalResponses is 2');
  assertEqual(paginated.summary.passCount, 1, 'summary passCount is 1');
  assertEqual(paginated.summary.failCount, 1, 'summary failCount is 1');
  assertEqual(paginated.summary.highestScore, 10, 'highest score is 10');
  assertEqual(paginated.summary.lowestScore, 0, 'lowest score is 0');

  // Test 3: Search filter
  const searchName = await getResponsesPaginated({ search: 'Jane' });
  assertEqual(searchName.total, 1, 'search by name returns 1 result');
  assertEqual(searchName.items[0].participant_name, 'Jane Doe', 'matched participant name is Jane Doe');

  const searchEmail = await getResponsesPaginated({ search: 'rotaractmapusa' });
  assertEqual(searchEmail.total, 1, 'search by email domain returns 1 result');

  // Test 4: Detail view and manual grading
  const subId = outcome.result!.submissionId;
  const detail = await getResponseDetail(subId);
  assert(detail !== null, 'getResponseDetail returns valid detail');
  assertEqual(detail?.questions.length, 2, 'detail includes both questions');
  
  const paraQ = detail?.questions.find(q => q.questionId === 'q2-para');
  assert(Boolean(paraQ?.textAnswer?.includes('blood donation')), 'paragraph text answer matches submission');
  assertEqual(paraQ?.earnedMarks, 5, 'paragraph earned marks is initially 5');

  // Admin manually adjusts marks to 4 out of 5 for paragraph
  const gradeUpdate = await updateManualGrade(subId, 'q2-para', 4);
  assert(gradeUpdate.success, 'updateManualGrade succeeds');
  assertEqual(gradeUpdate.newScore, 9, 'new total score is 9');
  assertEqual(gradeUpdate.newPercentage, 90, 'new percentage is 90%');

  const updatedDetail = await getResponseDetail(subId);
  assertEqual(updatedDetail?.submission.score, 9, 'detail reflects updated score 9');
  assertEqual(updatedDetail?.submission.percentage, 90, 'detail reflects updated percentage 90%');
  assertEqual(updatedDetail?.submission.passed, true, 'detail reflects passed true (90% >= 60%)');

  // Test 5: CSV Export
  const csv = await exportResponsesCsv();
  assert(csv.includes('Submission ID,Participant Name'), 'csv contains headers');
  assert(csv.includes('"Jane Doe"'), 'csv contains Jane Doe');
  assert(csv.includes('"Rotaract Club of Mapusa"'), 'csv contains club name');
  assert(csv.includes('90%'), 'csv contains updated 90%');
  assert(csv.includes('PASSED'), 'csv contains PASSED status');

  console.log(`\nResponses DAL tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('responses.test.ts')) {
  runResponseTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
