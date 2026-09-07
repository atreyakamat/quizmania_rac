import assert from 'assert';
import { saveQuiz, getQuizById, deleteQuiz } from '../packages/shared/src/dal/admin';
import { createQaFixtureQuiz } from '../packages/shared/src/fixtures/qa-fixture';
import type { Quiz } from '@quizmania/types';

async function runPersistenceTest() {
  console.log('====================================================');
  console.log('Testing Admin Persistence Lifecycle');
  console.log('====================================================');

  // 1. CREATE QUIZ with 7 questions from QA fixture
  console.log('\n[Step 1] Creating fresh quiz with 7 questions and sections...');
  const baseFixture = createQaFixtureQuiz();
  const testQuizId = '00000000-0000-0000-0000-0000000000bb';
  const testQuizSlug = 'test-admin-persistence-quiz';

  const newQuiz: Quiz = {
    ...baseFixture,
    id: testQuizId,
    slug: testQuizSlug,
    title: 'Persistence Test Quiz',
    status: 'draft'
  };

  const saved1 = await saveQuiz(newQuiz);
  assert(saved1, 'Saved quiz should not be null');
  assert.strictEqual(saved1.id, testQuizId, 'Quiz ID should match');
  assert.strictEqual(saved1.questions?.length, 7, 'Quiz should have 7 questions saved');
  assert.strictEqual(saved1.sections?.length, 2, 'Quiz should have 2 sections saved');
  console.log('✓ Step 1 passed: Quiz saved with 7 questions and 2 sections.');

  // 2. RELOAD QUIZ and verify hierarchy
  console.log('\n[Step 2] Reloading quiz from store...');
  const loaded1 = await getQuizById(testQuizId);
  assert(loaded1, 'Loaded quiz should not be null');
  assert.strictEqual(loaded1.questions?.length, 7, 'Reloaded quiz must contain 7 questions');
  assert.strictEqual(loaded1.sections?.length, 2, 'Reloaded quiz must contain 2 sections');
  const q4Original = loaded1.questions.find(q => q.question_order === 4);
  assert(q4Original, 'Question 4 should exist');
  console.log(`✓ Step 2 passed: Reloaded quiz with ${loaded1.questions.length} questions.`);

  // 3. EDIT Q4 and save
  console.log('\n[Step 3] Editing Question 4 text and marks...');
  const updatedQuestions1 = loaded1.questions.map(q => {
    if (q.question_order === 4) {
      return {
        ...q,
        question_text: 'EDITED Q4: Updated question title for test verification',
        marks: 10
      };
    }
    return q;
  });

  const saved2 = await saveQuiz({
    ...loaded1,
    questions: updatedQuestions1
  });
  console.log('✓ Step 3 passed: Quiz saved with edited Question 4.');

  // 4. RELOAD and verify Q4 edit
  console.log('\n[Step 4] Reloading quiz to verify Q4 edit persisted...');
  const loaded2 = await getQuizById(testQuizId);
  assert(loaded2, 'Loaded quiz should not be null');
  assert.strictEqual(loaded2.questions?.length, 7, 'Questions count must still be 7');
  const q4Updated = loaded2.questions.find(q => q.question_order === 4);
  assert(q4Updated, 'Q4 must exist');
  assert.strictEqual(q4Updated.question_text, 'EDITED Q4: Updated question title for test verification');
  assert.strictEqual(q4Updated.marks, 10);
  console.log('✓ Step 4 passed: Q4 text and marks verified correctly in reloaded quiz.');

  // 5. DELETE an option from Q1 (which initially has 4 options)
  console.log('\n[Step 5] Deleting an option from Question 1 (4 options -> 3 options)...');
  const q1Original = loaded2.questions.find(q => q.question_order === 1);
  assert(q1Original && q1Original.options?.length === 4, 'Q1 must initially have 4 options');

  const updatedQuestions2 = loaded2.questions.map(q => {
    if (q.question_order === 1 && q.options) {
      return {
        ...q,
        options: q.options.filter(opt => opt.option_order !== 4)
      };
    }
    return q;
  });

  await saveQuiz({
    ...loaded2,
    questions: updatedQuestions2
  });
  console.log('✓ Step 5 passed: Quiz saved with deleted option.');

  // 6. RELOAD and verify option deletion
  console.log('\n[Step 6] Reloading quiz to verify option deletion persisted...');
  const loaded3 = await getQuizById(testQuizId);
  assert(loaded3, 'Loaded quiz should not be null');
  const q1AfterDelete = loaded3.questions?.find(q => q.question_order === 1);
  assert(q1AfterDelete, 'Q1 must exist');
  assert.strictEqual(q1AfterDelete.options?.length, 3, 'Q1 must now have exactly 3 options');
  console.log('✓ Step 6 passed: Verified Q1 has 3 options after reload.');

  // 7. ADD an option to Q1 (3 options -> 4 options)
  console.log('\n[Step 7] Adding a new option to Question 1...');
  const newOptionId = '00000000-0000-0000-0000-000000009999';
  const updatedQuestions3 = loaded3.questions!.map(q => {
    if (q.question_order === 1 && q.options) {
      return {
        ...q,
        options: [
          ...q.options,
          {
            id: newOptionId,
            question_id: q.id,
            option_text: 'Newly Added Test Option',
            option_image: null,
            is_correct: false,
            option_order: 4
          }
        ]
      };
    }
    return q;
  });

  await saveQuiz({
    ...loaded3,
    questions: updatedQuestions3
  });
  console.log('✓ Step 7 passed: Quiz saved with newly added option.');

  // 8. RELOAD and verify added option
  console.log('\n[Step 8] Reloading quiz to verify added option persisted...');
  const loaded4 = await getQuizById(testQuizId);
  assert(loaded4, 'Loaded quiz should not be null');
  const q1AfterAdd = loaded4.questions?.find(q => q.question_order === 1);
  assert(q1AfterAdd, 'Q1 must exist');
  assert.strictEqual(q1AfterAdd.options?.length, 4, 'Q1 must now have 4 options again');
  const addedOpt = q1AfterAdd.options.find(o => o.id === newOptionId || o.option_text === 'Newly Added Test Option');
  assert(addedOpt, 'Added option must be present');
  assert.strictEqual(addedOpt.option_text, 'Newly Added Test Option');
  console.log('✓ Step 8 passed: Verified added option is present after reload.');

  // 9. CLEAN UP test quiz so store remains clean
  console.log('\n[Step 9] Cleaning up test quiz...');
  await deleteQuiz(testQuizId);
  const deletedCheck = await getQuizById(testQuizId);
  assert.strictEqual(deletedCheck, null, 'Quiz should be completely removed from store');
  console.log('✓ Step 9 passed: Test quiz deleted and store remains clean.');

  console.log('\n====================================================');
  console.log('ALL PERSISTENCE LIFECYCLE TESTS PASSED (9/9)!');
  console.log('====================================================\n');
}

runPersistenceTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
