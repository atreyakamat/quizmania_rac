process.env.FORCE_MOCK_STORE = 'true';

import {
  saveQuiz,
  getQuizById,
  getQuizBySlug,
  updateQuizStatus,
  deleteQuiz,
  getResponsesPaginated,
  getResponseDetail,
  getPublishedQuizBySlug,
  createQuizAttempt,
  getQuizAttemptByToken,
  scoreAndRecordQuizSubmission,
  mockStore
} from '../index';
import type { Quiz, Question, Option, QuizSubmissionPayload } from '@quizmania/types';

export async function runCrudLifecycleTests() {
  console.log('\n========================================');
  console.log('Running CRUD Lifecycle & Public Security Tests');
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

  const quizId = 'crud-test-quiz-100';
  const quizSlug = 'crud-lifecycle-test-2026';

  const initialQuiz: Quiz = {
    id: quizId,
    title: 'CRUD Lifecycle Initial Title',
    slug: quizSlug,
    description: 'A quiz for testing CRUD and duplicate prevention',
    status: 'draft',
    cover_image: null,
    theme_id: null,
    settings: {
      time_limit_minutes: 15,
      passing_score_percentage: 70,
      shuffle_questions: false,
      shuffle_options: false
    },
    sections: [
      { id: 'sec-1', quiz_id: quizId, title: 'General Round', section_order: 1 }
    ],
    questions: [
      {
        id: 'q-101',
        quiz_id: quizId,
        question_text: 'What is 10 + 10?',
        question_type: 'single_choice',
        marks: 5,
        negative_marks: 1,
        required: true,
        question_order: 1,
        section_id: 'sec-1',
        options: [
          { id: 'opt-101a', question_id: 'q-101', option_text: '20', is_correct: true, option_order: 1 },
          { id: 'opt-101b', question_id: 'q-101', option_text: '22', is_correct: false, option_order: 2 }
        ]
      },
      {
        id: 'q-102',
        quiz_id: quizId,
        question_text: 'What is the boiling point of water in Celsius?',
        question_type: 'short_text',
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 2,
        section_id: 'sec-1',
        accepted_answers: ['100', '100C', '100 C'],
        options: []
      }
    ]
  };

  // ------------------------------------------------------------------------
  // Case 25: Save Draft Quiz
  // ------------------------------------------------------------------------
  console.log('Case 25: Save Draft Quiz');
  const saved = await saveQuiz(initialQuiz);
  assert(saved !== null, 'Case 25: saveQuiz returns saved quiz');
  assertEqual(saved.id, quizId, 'Case 25: quiz id preserved');
  assertEqual(saved.status, 'draft', 'Case 25: quiz status is draft');
  assertEqual(saved.questions?.length, 2, 'Case 25: 2 questions saved');
  assertEqual(saved.questions?.[0].options?.length, 2, 'Case 25: 2 options saved for Q1');

  // ------------------------------------------------------------------------
  // Case 26: Reopen / Fetch Saved Draft Quiz
  // ------------------------------------------------------------------------
  console.log('\nCase 26: Reopen / Fetch Saved Draft Quiz');
  const reopened = await getQuizById(quizId);
  assert(reopened !== null, 'Case 26: getQuizById finds the saved quiz');
  assertEqual(reopened?.title, 'CRUD Lifecycle Initial Title', 'Case 26: title matches');
  assertEqual(reopened?.questions?.length, 2, 'Case 26: 2 questions preserved');
  assertEqual(reopened?.questions?.[0].options?.[0].option_text, '20', 'Case 26: Q1 option 1 text matches');
  assertEqual(reopened?.questions?.[1].accepted_answers?.[0], '100', 'Case 26: Q2 accepted answers match');

  // ------------------------------------------------------------------------
  // Case 27: Edit Draft Quiz Title and Description
  // ------------------------------------------------------------------------
  console.log('\nCase 27: Edit Draft Quiz Metadata');
  const updatedMetadata: Quiz = {
    ...reopened!,
    title: 'CRUD Lifecycle Edited Title',
    description: 'Updated description for CRUD test'
  };
  const savedAfterTitleEdit = await saveQuiz(updatedMetadata);
  assertEqual(savedAfterTitleEdit.title, 'CRUD Lifecycle Edited Title', 'Case 27: title updated');
  assertEqual(savedAfterTitleEdit.description, 'Updated description for CRUD test', 'Case 27: description updated');

  // ------------------------------------------------------------------------
  // Case 28: Add a New Question to Draft Quiz
  // ------------------------------------------------------------------------
  console.log('\nCase 28: Add a New Question');
  const newQuestion: Question = {
    id: 'q-103',
    quiz_id: quizId,
    question_text: 'Is the earth round?',
    question_type: 'true_false',
    marks: 2,
    negative_marks: 0,
    required: true,
    question_order: 3,
    options: [
      { id: 'opt-103t', question_id: 'q-103', option_text: 'True', is_correct: true, option_order: 1 },
      { id: 'opt-103f', question_id: 'q-103', option_text: 'False', is_correct: false, option_order: 2 }
    ]
  };
  const quizWithNewQ: Quiz = {
    ...savedAfterTitleEdit,
    questions: [...(savedAfterTitleEdit.questions || []), newQuestion]
  };
  const savedWithNewQ = await saveQuiz(quizWithNewQ);
  assertEqual(savedWithNewQ.questions?.length, 3, 'Case 28: question count is now 3');
  assertEqual(savedWithNewQ.questions?.[2].question_type, 'true_false', 'Case 28: new question is true_false');

  // ------------------------------------------------------------------------
  // Case 29: Add an Option to Existing Question
  // ------------------------------------------------------------------------
  console.log('\nCase 29: Add Option to Existing Question');
  const q1 = savedWithNewQ.questions![0];
  const updatedOptions: Option[] = [
    ...q1.options!,
    { id: 'opt-101c', question_id: q1.id, option_text: '30', is_correct: false, option_order: 3 }
  ];
  const quizWithExtraOpt: Quiz = {
    ...savedWithNewQ,
    questions: savedWithNewQ.questions!.map(q => q.id === q1.id ? { ...q, options: updatedOptions } : q)
  };
  const savedWithExtraOpt = await saveQuiz(quizWithExtraOpt);
  const q1Saved = savedWithExtraOpt.questions?.find(q => q.id === q1.id);
  assertEqual(q1Saved?.options?.length, 3, 'Case 29: Q1 now has 3 options');

  // ------------------------------------------------------------------------
  // Case 30: Delete an Option from a Question
  // ------------------------------------------------------------------------
  console.log('\nCase 30: Delete an Option from a Question');
  const q1OptionsAfterDelete = q1Saved!.options!.filter(o => o.id !== 'opt-101c');
  const quizAfterOptDelete: Quiz = {
    ...savedWithExtraOpt,
    questions: savedWithExtraOpt.questions!.map(q => q.id === q1.id ? { ...q, options: q1OptionsAfterDelete } : q)
  };
  const savedAfterOptDelete = await saveQuiz(quizAfterOptDelete);
  const q1AfterDel = savedAfterOptDelete.questions?.find(q => q.id === q1.id);
  assertEqual(q1AfterDel?.options?.length, 2, 'Case 30: Q1 is back to 2 options');

  // ------------------------------------------------------------------------
  // Case 31: Delete a Question from the Quiz
  // ------------------------------------------------------------------------
  console.log('\nCase 31: Delete a Question from the Quiz');
  const quizAfterQDelete: Quiz = {
    ...savedAfterOptDelete,
    questions: savedAfterOptDelete.questions!.filter(q => q.id !== 'q-103')
  };
  const savedAfterQDelete = await saveQuiz(quizAfterQDelete);
  assertEqual(savedAfterQDelete.questions?.length, 2, 'Case 31: questions count back to 2');

  // ------------------------------------------------------------------------
  // Case 32: Duplicate Prevention on Repeated Saves
  // ------------------------------------------------------------------------
  console.log('\nCase 32: Duplicate Prevention on Repeated Saves');
  // Save 3 consecutive times with the exact same quiz object
  await saveQuiz(savedAfterQDelete);
  await saveQuiz(savedAfterQDelete);
  const finalSavedQuiz = await saveQuiz(savedAfterQDelete);

  assertEqual(finalSavedQuiz.questions?.length, 2, 'Case 32: Question count remains exactly 2 after multiple saves');
  assertEqual(finalSavedQuiz.questions?.[0].options?.length, 2, 'Case 32: Q1 option count remains exactly 2');
  const optionIds = finalSavedQuiz.questions?.[0].options?.map(o => o.id);
  const uniqueOptionIds = new Set(optionIds);
  assertEqual(uniqueOptionIds.size, optionIds?.length, 'Case 32: All option IDs are unique');

  // ------------------------------------------------------------------------
  // Case 33: Publish Quiz
  // ------------------------------------------------------------------------
  console.log('\nCase 33: Publish Quiz');
  const publishedQuiz = await updateQuizStatus(quizId, 'published');
  assertEqual(publishedQuiz?.status, 'published', 'Case 33: Quiz status is published');

  // ------------------------------------------------------------------------
  // Case 34: Unpublish Quiz
  // ------------------------------------------------------------------------
  console.log('\nCase 34: Unpublish Quiz');
  const unpublishedQuiz = await updateQuizStatus(quizId, 'draft');
  assertEqual(unpublishedQuiz?.status, 'draft', 'Case 34: Quiz status is draft');
  const publicUnpublished = await getPublishedQuizBySlug(quizSlug);
  assert(publicUnpublished === null, 'Case 34: Unpublished quiz returns null to public DAL');

  // ------------------------------------------------------------------------
  // Case 35: Re-publish Quiz
  // ------------------------------------------------------------------------
  console.log('\nCase 35: Re-publish Quiz');
  const republishedQuiz = await updateQuizStatus(quizId, 'published');
  assertEqual(republishedQuiz?.status, 'published', 'Case 35: Quiz re-published');
  const publicRepublished = await getPublishedQuizBySlug(quizSlug);
  assert(publicRepublished !== null, 'Case 35: Re-published quiz is accessible to public DAL');

  // ------------------------------------------------------------------------
  // Case 36: Public Projection & Answer Concealment
  // ------------------------------------------------------------------------
  console.log('\nCase 36: Public Projection & Answer Concealment');
  const publicView = await getPublishedQuizBySlug(quizSlug);
  assert(publicView !== null, 'Case 36: public quiz found');
  assertEqual(publicView?.title, 'CRUD Lifecycle Edited Title', 'Case 36: public title matches');
  assertEqual(publicView?.questions.length, 2, 'Case 36: 2 public questions');

  // Invariant: no question has accepted_answers
  const leakedAcceptedAnswers = publicView?.questions.some(q => 'accepted_answers' in q || 'acceptedAnswers' in q);
  assert(!leakedAcceptedAnswers, 'Case 36: accepted_answers strictly omitted from public response');

  // Invariant: no option has is_correct
  const allPublicOptions = publicView?.questions.flatMap(q => q.options || []) || [];
  const leakedCorrect = allPublicOptions.some(o => 'is_correct' in o || 'isCorrect' in o);
  assert(!leakedCorrect, 'Case 36: is_correct strictly omitted from public options');

  // ------------------------------------------------------------------------
  // Case 37: Attempt Start
  // ------------------------------------------------------------------------
  console.log('\nCase 37: Attempt Start');
  const sessionToken1 = `attempt-token-1-${Date.now()}`;
  const attemptId1 = 'att-00000000-0000-4000-8000-000000000001';
  const startedAt1 = new Date().toISOString();
  const expiresAt1 = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const attemptRecord = await createQuizAttempt({
    id: attemptId1,
    quiz_id: quizId,
    session_token: sessionToken1,
    participant_name: 'E2E Test Participant',
    participant_email: 'participant@test.org',
    participant_data: {},
    started_at: startedAt1,
    expires_at: expiresAt1,
    status: 'in_progress'
  });
  assert(attemptRecord !== null, 'Case 37: createQuizAttempt created record');
  assertEqual(attemptRecord.id, attemptId1, 'Case 37: attemptId matches');
  assertEqual(attemptRecord.session_token, sessionToken1, 'Case 37: sessionToken matches');

  const fetchedAttempt = await getQuizAttemptByToken(sessionToken1);
  assert(fetchedAttempt !== null, 'Case 37: getQuizAttemptByToken retrieves attempt');

  // ------------------------------------------------------------------------
  // Case 38: Scoring Calculation (Correct submission)
  // ------------------------------------------------------------------------
  console.log('\nCase 38: Scoring Calculation (Correct submission)');
  const submissionPayloadCorrect: QuizSubmissionPayload = {
    participant: {
      name: 'E2E Test Participant',
      email: 'participant@test.org'
    },
    answers: [
      { questionId: 'q-101', selectedOptionId: 'opt-101a' }, // 5 marks
      { questionId: 'q-102', textAnswer: '100' }            // 5 marks
    ],
    attemptId: attemptId1,
    sessionToken: sessionToken1
  };

  const scoreResult = await scoreAndRecordQuizSubmission(quizSlug, submissionPayloadCorrect);
  assert(scoreResult.success === true, 'Case 38: submission scored successfully');
  assertEqual(scoreResult.result?.score, 10, 'Case 38: score is 10/10');
  assertEqual(scoreResult.result?.percentage, 100, 'Case 38: percentage is 100%');
  assertEqual(scoreResult.result?.passed, true, 'Case 38: passed is true (100% >= 70%)');

  // ------------------------------------------------------------------------
  // Case 39: Answer Validation & Penalty (Incorrect submission)
  // ------------------------------------------------------------------------
  console.log('\nCase 39: Answer Validation & Negative Marks');
  const sessionToken2 = `attempt-token-2-${Date.now()}`;
  const attemptId2 = 'att-00000000-0000-4000-8000-000000000002';
  await createQuizAttempt({
    id: attemptId2,
    quiz_id: quizId,
    session_token: sessionToken2,
    participant_name: 'Wrong Answers Participant',
    participant_email: 'wrong@test.org',
    participant_data: {},
    started_at: new Date().toISOString(),
    expires_at: expiresAt1,
    status: 'in_progress'
  });

  const submissionPayloadWrong: QuizSubmissionPayload = {
    participant: {
      name: 'Wrong Answers Participant',
      email: 'wrong@test.org'
    },
    answers: [
      { questionId: 'q-101', selectedOptionId: 'opt-101b' }, // wrong, -1 negative mark
      { questionId: 'q-102', textAnswer: '50' }              // wrong, 0 marks
    ],
    attemptId: attemptId2,
    sessionToken: sessionToken2
  };
  const wrongScoreResult = await scoreAndRecordQuizSubmission(quizSlug, submissionPayloadWrong);
  assert(wrongScoreResult.success === true, 'Case 39: wrong submission scored successfully');
  assertEqual(wrongScoreResult.result?.score, 0, 'Case 39: negative score floored at 0');
  assertEqual(wrongScoreResult.result?.passed, false, 'Case 39: passed is false');

  // ------------------------------------------------------------------------
  // Case 40: Record Submission Queryable
  // ------------------------------------------------------------------------
  console.log('\nCase 40: Record Submission Queryable');
  const responsesPaginated = await getResponsesPaginated({ quizId });
  assert(responsesPaginated.items.length >= 2, 'Case 40: At least 2 responses recorded for quiz');
  const participantSub = responsesPaginated.items.find(i => i.participant_name === 'E2E Test Participant');
  assert(participantSub !== undefined, 'Case 40: E2E participant submission found');
  assertEqual(participantSub?.score, 10, 'Case 40: participant score recorded as 10');
  assertEqual(participantSub?.passed, true, 'Case 40: participant passed recorded as true');

  // ------------------------------------------------------------------------
  // Case 41: Admin Response Detail
  // ------------------------------------------------------------------------
  console.log('\nCase 41: Admin Response Detail');
  const subDetail = await getResponseDetail(participantSub!.id);
  assert(subDetail !== null, 'Case 41: getResponseDetail returns detail');
  assertEqual(subDetail?.submission.participant_name, 'E2E Test Participant', 'Case 41: detail participant_name matches');
  assertEqual(subDetail?.submission.score, 10, 'Case 41: detail score matches');
  assertEqual(subDetail?.questions?.length, 2, 'Case 41: detail questions count matches');

  // Cleanup: delete test quiz
  await deleteQuiz(quizId);
  const deletedQuiz = await getQuizById(quizId);
  assert(deletedQuiz === null, 'Cleanup: test quiz deleted');

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCrudLifecycleTests().catch(err => {
  console.error('Fatal test error in CRUD lifecycle:', err);
  process.exit(1);
});
