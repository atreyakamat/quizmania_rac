import assert from 'assert';
import { 
  getAllQuizzes, 
  getQuizById, 
  saveQuiz, 
  deleteQuiz, 
  setQuizStatus, 
  importQuizFromJson, 
  exportQuizToJson,
  getAllThemes,
  saveTheme
} from '../packages/shared/src/dal/admin';
import { getPublishedQuizzesList } from '../packages/shared/src/dal/public';
import type { Quiz, Theme } from '@quizmania/types';

async function testAdminCrudFlow() {
  console.log('====================================================');
  console.log('Testing Admin CRUD API and Shared Layer Flow');
  console.log('====================================================');

  // Step 1: Verify clean slate (0 quizzes)
  console.log('\n[Step 1] Verifying initial clean slate (0 quizzes)...');
  const initialQuizzes = await getAllQuizzes();
  assert.strictEqual(initialQuizzes.length, 0, 'Initial quizzes count must be 0');
  const initialPublic = await getPublishedQuizzesList();
  assert.strictEqual(initialPublic.length, 0, 'Initial published quizzes must be 0');
  console.log('✓ Step 1 passed: Clean slate confirmed (0 quizzes).');

  // Step 2: Create a new Quiz (Draft)
  console.log('\n[Step 2] Creating a new draft quiz...');
  const newQuiz: Quiz = {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Rotaract District Trivia 2026',
    slug: 'rotaract-district-trivia-2026',
    description: 'Annual Rotaract district quiz challenge',
    status: 'draft',
    cover_image: null,
    theme_id: null,
    settings: {
      time_limit_minutes: 15,
      passing_score_percentage: 60,
      show_score_immediately: true,
      allow_review: true,
      require_participant_email: true
    },
    questions: [
      {
        id: '00000000-0000-0000-0000-000000000011',
        quiz_id: '00000000-0000-0000-0000-000000000001',
        question_text: 'What is the Rotaract motto?',
        question_type: 'single_choice',
        marks: 5,
        required: true,
        question_order: 1,
        options: [
          {
            id: '00000000-0000-0000-0000-000000000111',
            question_id: '00000000-0000-0000-0000-000000000011',
            option_text: 'Self Development - Fellowship Through Service',
            is_correct: true,
            option_order: 1
          },
          {
            id: '00000000-0000-0000-0000-000000000112',
            question_id: '00000000-0000-0000-0000-000000000011',
            option_text: 'Together Everyone Achieves More',
            is_correct: false,
            option_order: 2
          }
        ]
      }
    ]
  };

  const savedQuiz = await saveQuiz(newQuiz);
  assert(savedQuiz, 'Saved quiz must exist');
  assert.strictEqual(savedQuiz.title, 'Rotaract District Trivia 2026');
  assert.strictEqual(savedQuiz.questions?.length, 1);
  assert.strictEqual(savedQuiz.questions?.[0].options?.length, 2);
  console.log('✓ Step 2 passed: Draft quiz saved successfully.');

  // Step 3: Verify draft quiz is listed in admin, but NOT in public
  console.log('\n[Step 3] Verifying visibility separation between admin and public...');
  const adminQuizzes = await getAllQuizzes();
  assert.strictEqual(adminQuizzes.length, 1, 'Admin should see 1 quiz');
  const publicListDraft = await getPublishedQuizzesList();
  assert.strictEqual(publicListDraft.length, 0, 'Public should see 0 published quizzes when in draft');
  console.log('✓ Step 3 passed: Quiz is visible in Admin but hidden from Public.');

  // Step 4: Publish the quiz
  console.log('\n[Step 4] Publishing the quiz...');
  const publishedQuiz = await setQuizStatus(newQuiz.id, 'published');
  assert(publishedQuiz, 'Published quiz must exist');
  assert.strictEqual(publishedQuiz.status, 'published');

  const publicListPublished = await getPublishedQuizzesList();
  assert.strictEqual(publicListPublished.length, 1, 'Public should now see 1 published quiz');
  assert.strictEqual(publicListPublished[0].slug, 'rotaract-district-trivia-2026');
  console.log('✓ Step 4 passed: Quiz published and live on public site.');

  // Step 5: Update the quiz (Add a second question)
  console.log('\n[Step 5] Updating the quiz (adding Question 2)...');
  const updatedQuizData = {
    ...publishedQuiz,
    questions: [
      ...publishedQuiz.questions,
      {
        id: '00000000-0000-0000-0000-000000000012',
        quiz_id: newQuiz.id,
        question_text: 'Rotaract was officially founded in 1968.',
        question_type: 'true_false' as const,
        marks: 5,
        required: true,
        question_order: 2,
        options: [
          {
            id: '00000000-0000-0000-0000-000000000121',
            question_id: '00000000-0000-0000-0000-000000000012',
            option_text: 'True',
            is_correct: true,
            option_order: 1
          },
          {
            id: '00000000-0000-0000-0000-000000000122',
            question_id: '00000000-0000-0000-0000-000000000012',
            option_text: 'False',
            is_correct: false,
            option_order: 2
          }
        ]
      }
    ]
  };

  const updatedQuiz = await saveQuiz(updatedQuizData);
  assert.strictEqual(updatedQuiz.questions?.length, 2, 'Quiz must now have 2 questions');
  console.log('✓ Step 5 passed: Quiz updated with second question.');

  // Step 6: Export the quiz to JSON
  console.log('\n[Step 6] Exporting quiz to JSON format...');
  const exported = await exportQuizToJson(newQuiz.id);
  assert(exported, 'Exported JSON should exist');
  assert.strictEqual(exported.title, 'Rotaract District Trivia 2026');
  assert.strictEqual(exported.questions?.length, 2);
  console.log('✓ Step 6 passed: Quiz exported to JSON format.');

  // Step 7: Delete the quiz
  console.log('\n[Step 7] Deleting the quiz...');
  const deleteSuccess = await deleteQuiz(newQuiz.id);
  assert(deleteSuccess, 'Delete should succeed');
  const postDeleteAdmin = await getAllQuizzes();
  assert.strictEqual(postDeleteAdmin.length, 0, 'Admin quizzes must be 0 after delete');
  const postDeletePublic = await getPublishedQuizzesList();
  assert.strictEqual(postDeletePublic.length, 0, 'Public quizzes must be 0 after delete');
  console.log('✓ Step 7 passed: Quiz deleted completely from both admin and public.');

  // Step 8: Import quiz back from exported JSON
  console.log('\n[Step 8] Re-importing quiz from exported JSON...');
  const importedQuiz = await importQuizFromJson(exported);
  assert(importedQuiz, 'Imported quiz should exist');
  assert.strictEqual(importedQuiz.title, 'Rotaract District Trivia 2026');
  assert.strictEqual(importedQuiz.questions?.length, 2);
  console.log('✓ Step 8 passed: Quiz imported successfully from JSON.');

  // Step 9: Delete imported quiz to leave clean slate
  console.log('\n[Step 9] Cleaning up imported quiz...');
  await deleteQuiz(importedQuiz.id);
  const finalQuizzes = await getAllQuizzes();
  assert.strictEqual(finalQuizzes.length, 0, 'Final quizzes count must be 0');
  console.log('✓ Step 9 passed: Store reset to clean slate (0 quizzes).');

  console.log('\n====================================================');
  console.log('ALL ADMIN CRUD & LIFECYCLE TESTS PASSED (9/9)!');
  console.log('====================================================\n');
}

testAdminCrudFlow().catch(err => {
  console.error('CRUD flow test failed:', err);
  process.exit(1);
});
