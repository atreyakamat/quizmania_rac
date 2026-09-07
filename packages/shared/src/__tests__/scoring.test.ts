import { scoreQuestion, normalizeTextAnswer, calculateFinalScore, scoreAndRecordQuizSubmission } from '../scoring';
import type { Question, SelectedAnswer } from '@quizmania/types';

export async function runTests() {
  console.log('Running scoring tests...');
  let passed = 0;
  let failed = 0;

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

  // 1. normalizeTextAnswer
  assertEqual(normalizeTextAnswer('  HeLLo World  ', { caseSensitive: false, trimWhitespace: true, normalizeSpaces: true }), 'hello world', 'normalize text answer case insensitive trim');
  assertEqual(normalizeTextAnswer('  HeLLo   World  ', { caseSensitive: true, trimWhitespace: true, normalizeSpaces: true }), 'HeLLo World', 'normalize text answer case sensitive trim');
  
  // 2. scoreQuestion single_choice correct
  const qSingleChoice: Question = {
    id: 'q1',
    question_text: 'Q1',
    question_type: 'single_choice',
    question_image: null,
    marks: 5,
    negative_marks: 2,
    required: true,
    question_order: 1,
    options: [
      { id: 'o1', option_text: 'A', option_image: null, is_correct: true, option_order: 1 },
      { id: 'o2', option_text: 'B', option_image: null, is_correct: false, option_order: 2 }
    ]
  };
  
  let res = scoreQuestion({ question: qSingleChoice, answer: { questionId: 'q1', selectedOptionId: 'o1' } });
  assertEqual(res.earnedMarks, 5, 'single_choice correct');
  
  // 3. scoreQuestion single_choice incorrect (negative marking)
  res = scoreQuestion({ question: qSingleChoice, answer: { questionId: 'q1', selectedOptionId: 'o2' } });
  assertEqual(res.earnedMarks, -2, 'single_choice incorrect (negative marking)');

  // 4. scoreQuestion multiple_choice all_or_nothing pass
  const qMultiAllOrNothing: Question = {
    id: 'q2',
    question_text: 'Q2',
    question_type: 'multiple_choice',
    question_image: null,
    marks: 10,
    negative_marks: 3,
    required: true,
    question_order: 2,
    scoring_method: 'all_or_nothing',
    options: [
      { id: 'o1', option_text: 'A', option_image: null, is_correct: true, option_order: 1 },
      { id: 'o2', option_text: 'B', option_image: null, is_correct: true, option_order: 2 },
      { id: 'o3', option_text: 'C', option_image: null, is_correct: false, option_order: 3 }
    ]
  };
  res = scoreQuestion({ question: qMultiAllOrNothing, answer: { questionId: 'q2', selectedOptionIds: ['o1', 'o2'] } });
  assertEqual(res.earnedMarks, 10, 'multiple_choice all_or_nothing pass');

  // 5. scoreQuestion multiple_choice all_or_nothing fail (selected wrong)
  res = scoreQuestion({ question: qMultiAllOrNothing, answer: { questionId: 'q2', selectedOptionIds: ['o1', 'o3'] } });
  assertEqual(res.earnedMarks, -3, 'multiple_choice all_or_nothing fail (wrong selected)');
  
  // 6. scoreQuestion multiple_choice partial credit
  const qMultiPartial: Question = { ...qMultiAllOrNothing, scoring_method: 'partial' };
  res = scoreQuestion({ question: qMultiPartial, answer: { questionId: 'q2', selectedOptionIds: ['o1'] } });
  assertEqual(res.earnedMarks, 5, 'multiple_choice partial credit (1/2 correct)');
  
  res = scoreQuestion({ question: qMultiPartial, answer: { questionId: 'q2', selectedOptionIds: ['o1', 'o3'] } });
  assertEqual(res.earnedMarks, 0, 'multiple_choice partial credit (1 correct, 1 wrong, net 0)');

  // 7. scoreQuestion true_false
  const qTF: Question = {
    id: 'q3',
    question_text: 'Q3',
    question_type: 'true_false',
    question_image: null,
    marks: 2,
    negative_marks: 1,
    required: true,
    question_order: 3,
    options: [
      { id: 't', option_text: 'True', option_image: null, is_correct: true, option_order: 1 },
      { id: 'f', option_text: 'False', option_image: null, is_correct: false, option_order: 2 }
    ]
  };
  res = scoreQuestion({ question: qTF, answer: { questionId: 'q3', selectedOptionId: 't' } });
  assertEqual(res.earnedMarks, 2, 'true_false correct');
  
  // 8. scoreQuestion short_text match
  const qShortText: Question = {
  question_image: null,
    id: 'q4',
    question_text: 'Q4',
    question_type: 'short_text',
    marks: 5,
    negative_marks: 2,
    required: true,
    question_order: 4,
    accepted_answers: ['Hello World', 'Hi World'],
    case_sensitive: false,
    trim_whitespace: true,
    normalize_spaces: true
  };
  res = scoreQuestion({ question: qShortText, answer: { questionId: 'q4', textAnswer: '  hello  world  ' } });
  assertEqual(res.earnedMarks, 5, 'short_text match case insensitive normalized');
  
  // 9. scoreQuestion short_text no match
  res = scoreQuestion({ question: qShortText, answer: { questionId: 'q4', textAnswer: 'bye world' } });
  assertEqual(res.earnedMarks, -2, 'short_text no match');

  // 10. calculateFinalScore with allow_negative_total=false
  assertEqual(calculateFinalScore([{ earnedMarks: -2 } as any, { earnedMarks: -3 } as any], false), 0, 'calculateFinalScore floor at 0');
  
  // 11. calculateFinalScore with allow_negative_total=true
  assertEqual(calculateFinalScore([{ earnedMarks: -2 } as any, { earnedMarks: -3 } as any], true), -5, 'calculateFinalScore allow negative');

  // 12. Paragraph question with 0 marks
  const qParagraphZero: Question = {
    id: 'q5',
    question_text: 'Community reflection',
    question_type: 'paragraph',
    question_image: null,
    marks: 0,
    negative_marks: 0,
    required: false,
    question_order: 5,
    options: []
  };
  res = scoreQuestion({ question: qParagraphZero, answer: { questionId: 'q5', textAnswer: 'We hosted a blood donation camp.' } });
  assertEqual(res.earnedMarks, 0, 'paragraph with 0 max marks yields 0 earned marks');
  assertEqual(res.isCorrect, true, 'paragraph with non-empty text marked isCorrect true');
  assertEqual(res.maxMarks, 0, 'paragraph max marks is 0');

  res = scoreQuestion({ question: qParagraphZero, answer: { questionId: 'q5', textAnswer: '   ' } });
  assertEqual(res.earnedMarks, 0, 'paragraph with whitespace yields 0 marks');
  assertEqual(res.isCorrect, false, 'paragraph with empty text marked isCorrect false');

  // 13. Multiple choice partial credit edge cases (3 correct out of 4 options, 6 marks)
  const qMulti3of4: Question = {
    id: 'q6',
    question_text: 'Select 3 of 4',
    question_type: 'multiple_choice',
    question_image: null,
    marks: 6,
    negative_marks: 0,
    required: true,
    question_order: 6,
    scoring_method: 'partial',
    options: [
      { id: 'o1', option_text: 'Correct 1', option_image: null, is_correct: true, option_order: 1 },
      { id: 'o2', option_text: 'Correct 2', option_image: null, is_correct: true, option_order: 2 },
      { id: 'o3', option_text: 'Correct 3', option_image: null, is_correct: true, option_order: 3 },
      { id: 'o4', option_text: 'Wrong 4', option_image: null, is_correct: false, option_order: 4 }
    ]
  };

  // Case A: 3 correct, 0 wrong -> 6 marks
  res = scoreQuestion({ question: qMulti3of4, answer: { questionId: 'q6', selectedOptionIds: ['o1', 'o2', 'o3'] } });
  assertEqual(res.earnedMarks, 6, 'partial credit 3/3 correct yields full marks (6)');
  assertEqual(res.isCorrect, true, 'partial credit 3/3 is marked correct');

  // Case B: 2 correct, 0 wrong -> 4 marks (2/3 * 6 = 4)
  res = scoreQuestion({ question: qMulti3of4, answer: { questionId: 'q6', selectedOptionIds: ['o1', 'o2'] } });
  assertEqual(res.earnedMarks, 4, 'partial credit 2/3 correct yields 4 marks');
  assertEqual(res.isCorrect, false, 'partial credit 2/3 is not full correct');

  // Case C: 1 correct, 1 wrong -> (1 - 1)/3 = 0 marks
  res = scoreQuestion({ question: qMulti3of4, answer: { questionId: 'q6', selectedOptionIds: ['o1', 'o4'] } });
  assertEqual(res.earnedMarks, 0, 'partial credit 1 correct + 1 wrong yields 0 marks');

  // Case D: 1 correct, 2 wrong (hypothetical penalty > correct) -> floored at 0
  res = scoreQuestion({ question: qMulti3of4, answer: { questionId: 'q6', selectedOptionIds: ['o4'] } });
  assertEqual(res.earnedMarks, 0, 'partial credit only wrong options floored at 0');

  // Case E: 0 options selected
  res = scoreQuestion({ question: qMulti3of4, answer: { questionId: 'q6', selectedOptionIds: [] } });
  assertEqual(res.earnedMarks, 0, 'partial credit 0 options selected yields 0 marks');

  // 14. Negative marking floor in mixed submission
  const mixedBreakdown = [
    { earnedMarks: 5, maxMarks: 5 },
    { earnedMarks: -4, maxMarks: 4 },
    { earnedMarks: -3, maxMarks: 3 }
  ];
  // 5 - 4 - 3 = -2 -> floored to 0
  assertEqual(calculateFinalScore(mixedBreakdown as any, false), 0, 'mixed negative total floored to 0 with allowNegativeTotal=false');
  assertEqual(calculateFinalScore(mixedBreakdown as any, true), -2, 'mixed negative total preserved with allowNegativeTotal=true');

  // 15. Invalid option ID rejection security test
  const invalidSubmissionRes = await scoreAndRecordQuizSubmission('00000000-0000-0000-0000-0000000000aa', {
    participant: { name: 'Security Tester' },
    answers: [
      { questionId: '00000000-0000-0000-0000-0000000000f1', selectedOptionId: 'invalid-non-existent-option' }
    ]
  });
  assertEqual(invalidSubmissionRes.success, false, 'rejects invalid option ID not belonging to question');

  console.log(`\nTests complete. Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    throw new Error('Some tests failed');
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
