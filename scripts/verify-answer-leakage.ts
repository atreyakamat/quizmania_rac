import assert from 'assert';
import { getPublishedQuizBySlug } from '../packages/shared/src/dal/public';
import { mockStore } from '../packages/shared/src/mock-data';
import { createQaFixtureQuiz, QA_QUIZ_ID } from '../packages/shared/src/fixtures/qa-fixture';

async function verifyNoLeakage() {
  console.log('====================================================');
  console.log('Testing Answer Key Leakage Protection');
  console.log('====================================================');

  // Seed fixture quiz in store for leakage verification
  mockStore.saveQuiz(createQaFixtureQuiz());

  try {
    const testSlugs = ['quizmania-qa-full-engine-test'];
    const forbiddenKeys = ['is_correct', 'accepted_answers', 'case_sensitive', 'trim_whitespace', 'normalize_spaces'];

    for (const slug of testSlugs) {
      console.log(`\nInspecting public quiz data for slug: "${slug}"...`);
      const quiz = await getPublishedQuizBySlug(slug);
      assert(quiz, `Quiz "${slug}" should be found`);

      const jsonStr = JSON.stringify(quiz);

      for (const key of forbiddenKeys) {
        // Check if key appears as JSON property e.g. "is_correct":
        const regex = new RegExp(`"${key}"\\s*:`, 'i');
        const hasLeak = regex.test(jsonStr);
        if (hasLeak) {
          throw new Error(`CRITICAL SECURITY FAILURE: Found forbidden key "${key}" in public quiz payload for slug "${slug}"!`);
        }
        console.log(`✓ Verified key "${key}" is completely absent`);
      }

      // Inspect each option object
      for (const q of quiz.questions) {
        for (const opt of q.options) {
          assert.strictEqual((opt as any).is_correct, undefined, 'Option must not have is_correct');
        }
        assert.strictEqual((q as any).accepted_answers, undefined, 'Question must not have accepted_answers');
        assert.strictEqual((q as any).case_sensitive, undefined, 'Question must not have case_sensitive');
      }
      console.log(`✓ All questions and options for "${slug}" are cleanly sanitized!`);
    }

    console.log('\n====================================================');
    console.log('ALL ANSWER LEAKAGE TESTS PASSED! ZERO LEAKS CONFIRMED.');
    console.log('====================================================\n');
  } finally {
    // Clean up fixture after test
    mockStore.deleteQuiz(QA_QUIZ_ID);
  }
}

verifyNoLeakage().catch(err => {
  console.error(err);
  process.exit(1);
});
