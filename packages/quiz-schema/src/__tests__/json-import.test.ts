import { test } from 'node:test';
import {
  validateQuizJson,
  convertQuizJsonToQuiz,
  EXAMPLE_IMPORT_JSON,
  validateScheduleTimes,
  getQuizAvailability,
  generateSlug,
  generateCanonicalUuid,
  generateSecureToken,
  shuffleArray,
  isCanonicalUuid
} from '../index';
import type { QuizJsonImportFormat } from '@quizmania/types';

export async function runJsonImportTests() {
  console.log('\n========================================');
  console.log('Running Comprehensive JSON Import Tests');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    }
  }

  function assertEqual(actual: any, expected: any, testName: string) {
    if (actual === expected) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${testName}`);
      console.error(`         Expected: ${JSON.stringify(expected)}`);
      console.error(`         Actual:   ${JSON.stringify(actual)}`);
    }
  }

  // ------------------------------------------------------------------------
  // Test 1: Basic single-choice import
  // ------------------------------------------------------------------------
  console.log('Scenario 1: Basic single-choice import');
  const jsonSingleChoice = JSON.stringify({
    title: 'Geography Quiz',
    description: 'A test on capitals',
    questions: [
      {
        id: 1,
        question: 'What is the capital of Japan?',
        type: 'single_choice',
        marks: 4,
        options: [
          { id: 'a', text: 'Tokyo', correct: true },
          { id: 'b', text: 'Kyoto', correct: false },
          { id: 'c', text: 'Osaka', correct: false },
          { id: 'd', text: 'Nagoya', correct: false }
        ]
      }
    ]
  });

  const res1 = convertQuizJsonToQuiz(jsonSingleChoice);
  assert(res1.success === true, 'Test 1: convert single-choice succeeds');
  assertEqual(res1.quiz?.title, 'Geography Quiz', 'Test 1: Quiz title parsed');
  assertEqual(res1.quiz?.questions.length, 1, 'Test 1: 1 question parsed');
  assertEqual(res1.quiz?.questions[0].question_type, 'single_choice', 'Test 1: type is single_choice');
  assertEqual(res1.quiz?.questions[0].marks, 4, 'Test 1: marks is 4');
  assertEqual(res1.quiz?.questions[0].options.length, 4, 'Test 1: 4 options parsed');
  assertEqual(res1.quiz?.questions[0].options[0].is_correct, true, 'Test 1: option 0 is correct');
  assertEqual(res1.quiz?.questions[0].options[1].is_correct, false, 'Test 1: option 1 is false');

  // ------------------------------------------------------------------------
  // Test 2: Multiple-choice with multiple correct answers
  // ------------------------------------------------------------------------
  console.log('\nScenario 2: Multiple-choice with multiple correct answers');
  const jsonMultiChoice = JSON.stringify({
    title: 'Science Quiz',
    questions: [
      {
        id: 10,
        question: 'Select all prime numbers:',
        type: 'multiple_choice',
        marks: 5,
        negativeMarks: 1,
        scoringMethod: 'all_or_nothing',
        options: [
          { id: 'a', text: '2', correct: true },
          { id: 'b', text: '3', correct: true },
          { id: 'c', text: '4', correct: false },
          { id: 'd', text: '5', correct: true }
        ]
      }
    ]
  });

  const res2 = convertQuizJsonToQuiz(jsonMultiChoice);
  assert(res2.success === true, 'Test 2: convert multiple-choice succeeds');
  assertEqual(res2.quiz?.questions[0].question_type, 'multiple_choice', 'Test 2: type is multiple_choice');
  assertEqual(res2.quiz?.questions[0].negative_marks, 1, 'Test 2: negative_marks parsed');
  assertEqual(res2.quiz?.questions[0].scoring_method, 'all_or_nothing', 'Test 2: scoring_method parsed');
  const correctOptionsCount = res2.quiz?.questions[0].options.filter(o => o.is_correct).length;
  assertEqual(correctOptionsCount, 3, 'Test 2: 3 options are correct');

  // ------------------------------------------------------------------------
  // Test 3: True / False question
  // ------------------------------------------------------------------------
  console.log('\nScenario 3: True/False question');
  const jsonTrueFalse = JSON.stringify({
    title: 'Biology Quiz',
    questions: [
      {
        id: 'q-tf',
        question: 'The human body has 206 bones.',
        type: 'true_false',
        marks: 2,
        options: [
          { id: 't', text: 'True', correct: true },
          { id: 'f', text: 'False', correct: false }
        ]
      }
    ]
  });

  const res3 = convertQuizJsonToQuiz(jsonTrueFalse);
  assert(res3.success === true, 'Test 3: convert true_false succeeds');
  assertEqual(res3.quiz?.questions[0].question_type, 'true_false', 'Test 3: type is true_false');
  assertEqual(res3.quiz?.questions[0].options.length, 2, 'Test 3: exactly 2 options');
  assertEqual(res3.quiz?.questions[0].options[0].option_text, 'True', 'Test 3: option 1 is True');
  assertEqual(res3.quiz?.questions[0].options[0].is_correct, true, 'Test 3: option True is correct');

  // ------------------------------------------------------------------------
  // Test 4: Short text question
  // ------------------------------------------------------------------------
  console.log('\nScenario 4: Short text question');
  const jsonShortText = JSON.stringify({
    title: 'History Quiz',
    questions: [
      {
        id: 'st-1',
        question: 'Who was the first president of the United States?',
        type: 'short_text',
        marks: 5,
        acceptedAnswers: ['George Washington', 'Washington'],
        caseSensitive: false,
        trimWhitespace: true,
        normalizeSpaces: true
      }
    ]
  });

  const res4 = convertQuizJsonToQuiz(jsonShortText);
  assert(res4.success === true, 'Test 4: convert short_text succeeds');
  assertEqual(res4.quiz?.questions[0].question_type, 'short_text', 'Test 4: type is short_text');
  assertEqual(res4.quiz?.questions[0].accepted_answers?.length, 2, 'Test 4: 2 accepted answers');
  assertEqual(res4.quiz?.questions[0].case_sensitive, false, 'Test 4: case_sensitive false');
  assertEqual(res4.quiz?.questions[0].trim_whitespace, true, 'Test 4: trim_whitespace true');

  // Scenario 4b: Short text survey/registration question with marks: 0 and acceptedAnswers: [""]
  console.log('\nScenario 4b: Short text registration / survey question (marks: 0)');
  const jsonShortTextSurvey = JSON.stringify({
    title: 'Registration Form',
    questions: [
      {
        id: 1,
        type: 'short_text',
        question: 'Full Name',
        marks: 0,
        negativeMarks: 0,
        required: true,
        acceptedAnswers: ['']
      },
      {
        id: 2,
        type: 'short_text',
        question: 'Email Address',
        marks: 0,
        negativeMarks: 0,
        required: true,
        acceptedAnswers: []
      }
    ]
  });

  const res4b = convertQuizJsonToQuiz(jsonShortTextSurvey);
  assert(res4b.success === true, 'Test 4b: convert short_text with marks 0 succeeds');
  assertEqual(res4b.quiz?.questions.length, 2, 'Test 4b: 2 questions parsed');
  assertEqual(res4b.quiz?.questions[0].marks, 0, 'Test 4b: Q1 marks is 0');
  assertEqual(res4b.quiz?.questions[0].accepted_answers?.length, 0, 'Test 4b: blank accepted answers stripped to empty array');


  // ------------------------------------------------------------------------
  // Test 5: Paragraph question
  // ------------------------------------------------------------------------
  console.log('\nScenario 5: Paragraph question');
  const jsonParagraph = JSON.stringify({
    title: 'Essay Quiz',
    questions: [
      {
        id: 'p-1',
        question: 'Explain the theory of relativity in your own words.',
        type: 'paragraph',
        marks: 10,
        required: true
      }
    ]
  });

  const res5 = convertQuizJsonToQuiz(jsonParagraph);
  assert(res5.success === true, 'Test 5: convert paragraph succeeds');
  assertEqual(res5.quiz?.questions[0].question_type, 'paragraph', 'Test 5: type is paragraph');
  assertEqual(res5.quiz?.questions[0].marks, 10, 'Test 5: marks 10');
  assertEqual(res5.quiz?.questions[0].options.length, 0, 'Test 5: no options for paragraph');

  // ------------------------------------------------------------------------
  // Test 6: Question images
  // ------------------------------------------------------------------------
  console.log('\nScenario 6: Question images');
  const jsonQuestionImage = JSON.stringify({
    title: 'Art History',
    questions: [
      {
        id: 1,
        question: 'Who painted this masterpiece?',
        type: 'single_choice',
        image: 'https://images.unsplash.com/mona-lisa.jpg',
        options: [
          { id: 'a', text: 'Leonardo da Vinci', correct: true },
          { id: 'b', text: 'Michelangelo', correct: false }
        ]
      }
    ]
  });

  const res6 = convertQuizJsonToQuiz(jsonQuestionImage);
  assert(res6.success === true, 'Test 6: convert question image succeeds');
  assertEqual(res6.quiz?.questions[0].question_image, 'https://images.unsplash.com/mona-lisa.jpg', 'Test 6: question_image parsed');

  // ------------------------------------------------------------------------
  // Test 7: Option images
  // ------------------------------------------------------------------------
  console.log('\nScenario 7: Option images');
  const jsonOptionImage = JSON.stringify({
    title: 'Flag Identification',
    questions: [
      {
        id: 1,
        question: 'Which of the following is the flag of India?',
        type: 'single_choice',
        options: [
          { id: 'a', text: 'India', image: 'https://images.unsplash.com/flag-in.png', correct: true },
          { id: 'b', text: 'France', image: 'https://images.unsplash.com/flag-fr.png', correct: false }
        ]
      }
    ]
  });

  const res7 = convertQuizJsonToQuiz(jsonOptionImage);
  assert(res7.success === true, 'Test 7: convert option image succeeds');
  assertEqual(res7.quiz?.questions[0].options[0].option_image, 'https://images.unsplash.com/flag-in.png', 'Test 7: option 0 image parsed');
  assertEqual(res7.quiz?.questions[0].options[1].option_image, 'https://images.unsplash.com/flag-fr.png', 'Test 7: option 1 image parsed');

  // ------------------------------------------------------------------------
  // Test 8: Marks & negative marks
  // ------------------------------------------------------------------------
  console.log('\nScenario 8: Marks & negative marks');
  const jsonMarks = JSON.stringify({
    title: 'Exam Quiz',
    questions: [
      {
        id: 1,
        question: 'High-stakes question',
        type: 'single_choice',
        marks: 10,
        negativeMarks: 2.5,
        options: [
          { id: 'a', text: 'Right', correct: true },
          { id: 'b', text: 'Wrong', correct: false }
        ]
      }
    ]
  });

  const res8 = convertQuizJsonToQuiz(jsonMarks);
  assert(res8.success === true, 'Test 8: convert marks succeeds');
  assertEqual(res8.quiz?.questions[0].marks, 10, 'Test 8: marks is 10');
  assertEqual(res8.quiz?.questions[0].negative_marks, 2.5, 'Test 8: negative_marks is 2.5');

  // ------------------------------------------------------------------------
  // Test 9: Sections
  // ------------------------------------------------------------------------
  console.log('\nScenario 9: Sections');
  const jsonSections = JSON.stringify({
    title: 'Sectioned Exam',
    sections: [
      {
        id: 'sec-1',
        title: 'Physics',
        description: 'Physics questions',
        questions: ['q1']
      },
      {
        id: 'sec-2',
        title: 'Chemistry',
        description: 'Chemistry questions',
        questions: ['q2']
      }
    ],
    questions: [
      {
        id: 'q1',
        question: 'Velocity of light?',
        type: 'single_choice',
        options: [
          { id: 'a', text: '3x10^8 m/s', correct: true },
          { id: 'b', text: '3x10^6 m/s', correct: false }
        ]
      },
      {
        id: 'q2',
        question: 'Atomic number of Carbon?',
        type: 'single_choice',
        options: [
          { id: 'a', text: '6', correct: true },
          { id: 'b', text: '12', correct: false }
        ]
      }
    ]
  });

  const res9 = convertQuizJsonToQuiz(jsonSections);
  assert(res9.success === true, 'Test 9: convert sections succeeds');
  assertEqual(res9.quiz?.sections?.length, 2, 'Test 9: 2 sections created');
  assertEqual(res9.quiz?.questions[0].section_title, 'Physics', 'Test 9: question 1 mapped to Physics section');
  assertEqual(res9.quiz?.questions[1].section_title, 'Chemistry', 'Test 9: question 2 mapped to Chemistry section');
  assertEqual(res9.summary?.sectionsCount, 2, 'Test 9: summary reports 2 sections');

  // ------------------------------------------------------------------------
  // Test 10: Quiz Settings
  // ------------------------------------------------------------------------
  console.log('\nScenario 10: Settings');
  const jsonSettings = JSON.stringify({
    title: 'Timed Challenge',
    settings: {
      timeLimitMinutes: 25,
      passingScorePercentage: 75,
      showScoreImmediately: true,
      requireParticipantEmail: true,
      shuffleQuestions: true,
      shuffleOptions: true
    },
    questions: [
      {
        id: 1,
        question: 'Sample question?',
        type: 'single_choice',
        options: [
          { id: 'a', text: 'Yes', correct: true },
          { id: 'b', text: 'No', correct: false }
        ]
      }
    ]
  });

  const res10 = convertQuizJsonToQuiz(jsonSettings);
  assert(res10.success === true, 'Test 10: convert settings succeeds');
  assertEqual(res10.quiz?.settings.time_limit_minutes, 25, 'Test 10: time_limit_minutes is 25');
  assertEqual(res10.quiz?.settings.passing_score_percentage, 75, 'Test 10: passing_score_percentage is 75');
  assertEqual(res10.quiz?.settings.require_participant_email, true, 'Test 10: require_participant_email is true');
  assertEqual(res10.quiz?.settings.shuffle_questions, true, 'Test 10: shuffle_questions is true');
  assertEqual(res10.quiz?.settings.shuffle_options, true, 'Test 10: shuffle_options is true');

  // ------------------------------------------------------------------------
  // Test 11: Invalid JSON syntax
  // ------------------------------------------------------------------------
  console.log('\nScenario 11: Invalid JSON syntax');
  const invalidJsonString = '{ title: "Unquoted key", }';
  const res11 = validateQuizJson(invalidJsonString);
  assert(res11.success === false, 'Test 11: invalid JSON syntax rejected');
  assert(res11.errors && res11.errors.length > 0, 'Test 11: error message present');
  assert(res11.errors![0].includes('Invalid JSON'), 'Test 11: error indicates invalid JSON');

  // ------------------------------------------------------------------------
  // Test 12: Invalid question structure (missing question text)
  // ------------------------------------------------------------------------
  console.log('\nScenario 12: Invalid question structure');
  const missingQText = JSON.stringify({
    title: 'Missing Question Text Quiz',
    questions: [
      {
        id: 1,
        question: '',
        type: 'single_choice',
        options: [
          { id: 'a', text: 'Opt 1', correct: true },
          { id: 'b', text: 'Opt 2', correct: false }
        ]
      }
    ]
  });
  const res12 = validateQuizJson(missingQText);
  assert(res12.success === false, 'Test 12: missing question text rejected');
  assert(res12.errors!.some(e => e.includes('Question text is required')), 'Test 12: error specifically mentions question text required');

  // ------------------------------------------------------------------------
  // Test 13: Wrong correct-answer counts
  // ------------------------------------------------------------------------
  console.log('\nScenario 13: Wrong correct-answer counts');
  // 13a: single_choice with 0 correct
  const singleChoiceZeroCorrect = JSON.stringify({
    title: 'Zero Correct',
    questions: [
      {
        id: 1,
        question: 'Which one?',
        type: 'single_choice',
        options: [
          { id: 'a', text: 'A', correct: false },
          { id: 'b', text: 'B', correct: false }
        ]
      }
    ]
  });
  const res13a = validateQuizJson(singleChoiceZeroCorrect);
  assert(res13a.success === false, 'Test 13a: single_choice with 0 correct rejected');
  assert(res13a.errors!.some(e => e.includes('none found')), 'Test 13a: error notes none found');

  // 13b: single_choice with 2 correct
  const singleChoiceTwoCorrect = JSON.stringify({
    title: 'Two Correct',
    questions: [
      {
        id: 1,
        question: 'Which one?',
        type: 'single_choice',
        options: [
          { id: 'a', text: 'A', correct: true },
          { id: 'b', text: 'B', correct: true }
        ]
      }
    ]
  });
  const res13b = validateQuizJson(singleChoiceTwoCorrect);
  assert(res13b.success === false, 'Test 13b: single_choice with 2 correct rejected');
  assert(res13b.errors!.some(e => e.includes('2 found')), 'Test 13b: error notes 2 found');

  // 13c: multiple_choice with 0 correct
  const multiChoiceZeroCorrect = JSON.stringify({
    title: 'Multi Zero Correct',
    questions: [
      {
        id: 1,
        question: 'Which ones?',
        type: 'multiple_choice',
        options: [
          { id: 'a', text: 'A', correct: false },
          { id: 'b', text: 'B', correct: false }
        ]
      }
    ]
  });
  const res13c = validateQuizJson(multiChoiceZeroCorrect);
  assert(res13c.success === false, 'Test 13c: multiple_choice with 0 correct rejected');

  // 13d: duplicate option IDs
  const duplicateOptionIds = JSON.stringify({
    title: 'Duplicate Option IDs',
    questions: [
      {
        id: 1,
        question: 'Which?',
        type: 'single_choice',
        options: [
          { id: 'a', text: 'Option A', correct: true },
          { id: 'a', text: 'Option B', correct: false }
        ]
      }
    ]
  });
  const res13d = validateQuizJson(duplicateOptionIds);
  assert(res13d.success === false, 'Test 13d: duplicate option ID rejected');
  assert(res13d.errors!.some(e => e.includes('Duplicate option ID')), 'Test 13d: error notes duplicate option ID');

  // ------------------------------------------------------------------------
  // Test 14: Export -> Import round-trip compatibility
  // ------------------------------------------------------------------------
  console.log('\nScenario 14: Export -> Import round-trip');
  const exportFormatQuiz: QuizJsonImportFormat = {
    title: 'Roundtrip Test Quiz',
    slug: 'roundtrip-test-quiz',
    description: 'Verifying roundtrip fidelity',
    status: 'draft',
    settings: {
      time_limit_minutes: 20,
      passing_score_percentage: 60
    },
    questions: [
      {
        id: 'q-export-1',
        question: 'What is 5 + 5?',
        type: 'single_choice',
        required: true,
        marks: 5,
        negative_marks: 1,
        options: [
          { id: 'opt-1', text: '10', correct: true },
          { id: 'opt-2', text: '11', correct: false }
        ]
      },
      {
        id: 'q-export-2',
        question: 'Pick multiples of 3:',
        type: 'multiple_choice',
        required: true,
        marks: 10,
        options: [
          { id: 'opt-3', text: '3', correct: true },
          { id: 'opt-4', text: '6', correct: true },
          { id: 'opt-5', text: '7', correct: false }
        ]
      }
    ]
  };

  const roundTripString = JSON.stringify(exportFormatQuiz);
  const res14 = convertQuizJsonToQuiz(roundTripString);
  assert(res14.success === true, 'Test 14: export format imported successfully');
  assertEqual(res14.quiz?.title, 'Roundtrip Test Quiz', 'Test 14: title preserved');
  assertEqual(res14.quiz?.slug, 'roundtrip-test-quiz', 'Test 14: slug preserved');
  assertEqual(res14.quiz?.questions.length, 2, 'Test 14: question count matches');
  assertEqual(res14.quiz?.questions[0].marks, 5, 'Test 14: question 1 marks preserved');
  assertEqual(res14.quiz?.questions[0].negative_marks, 1, 'Test 14: question 1 negative marks preserved');
  assertEqual(res14.quiz?.questions[1].options.length, 3, 'Test 14: question 2 options count preserved');
  assertEqual(res14.quiz?.questions[1].options[0].is_correct, true, 'Test 14: question 2 option 0 is_correct preserved');
  assertEqual(res14.quiz?.questions[1].options[2].is_correct, false, 'Test 14: question 2 option 2 is_correct preserved');

  // Also verify canonical EXAMPLE_IMPORT_JSON
  const resExample = convertQuizJsonToQuiz(EXAMPLE_IMPORT_JSON);
  assert(resExample.success === true, 'Bonus: EXAMPLE_IMPORT_JSON parses and converts cleanly');
  assertEqual(resExample.summary?.questionsCount, 3, 'Bonus: EXAMPLE_IMPORT_JSON has 3 questions');

  // ------------------------------------------------------------------------
  // Test 15: Schedule Window Validation
  // ------------------------------------------------------------------------
  console.log('\nScenario 15: Schedule window validation');
  assert(validateScheduleTimes().valid, 'Test 15a: no dates is valid');
  assert(validateScheduleTimes(null, null).valid, 'Test 15b: null dates is valid');
  assert(validateScheduleTimes('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z').valid, 'Test 15c: start before end is valid');
  assert(!validateScheduleTimes('invalid-date', '2026-01-02T00:00:00Z').valid, 'Test 15d: invalid start rejected');
  assert(!validateScheduleTimes('2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z').valid, 'Test 15e: end before start rejected');

  // ------------------------------------------------------------------------
  // Test 16: Quiz Availability Determination
  // ------------------------------------------------------------------------
  console.log('Scenario 16: Quiz availability determination');
  const now = new Date('2026-06-15T12:00:00Z');
  const availUnpublished = getQuizAvailability({ status: 'closed' }, now);
  assert(!availUnpublished.isAvailable && availUnpublished.status === 'unpublished', 'Test 16a: closed is unpublished');

  const availDraft = getQuizAvailability({ status: 'draft' }, now);
  assert(!availDraft.isAvailable && availDraft.status === 'draft', 'Test 16b: draft is draft');

  const availNoSchedule = getQuizAvailability({ status: 'published', settings: { schedule_enabled: false } }, now);
  assert(availNoSchedule.isAvailable && availNoSchedule.status === 'live', 'Test 16c: published without schedule is live');

  const availUpcoming = getQuizAvailability({
    status: 'published',
    start_at: '2026-06-20T00:00:00Z',
    settings: { schedule_enabled: true }
  }, now);
  assert(!availUpcoming.isAvailable && availUpcoming.status === 'upcoming', 'Test 16d: future start is upcoming');

  const availExpired = getQuizAvailability({
    status: 'published',
    end_at: '2026-06-10T00:00:00Z',
    settings: { schedule_enabled: true }
  }, now);
  assert(!availExpired.isAvailable && availExpired.status === 'expired', 'Test 16e: past end is expired');

  const availLiveActive = getQuizAvailability({
    status: 'published',
    start_at: '2026-06-10T00:00:00Z',
    end_at: '2026-06-20T00:00:00Z',
    settings: { schedule_enabled: true }
  }, now);
  assert(availLiveActive.isAvailable && availLiveActive.status === 'live', 'Test 16f: within window is live');

  // ------------------------------------------------------------------------
  // Test 17: Canonical Slug Generation
  // ------------------------------------------------------------------------
  console.log('Scenario 17: Slug generation');
  assertEqual(generateSlug('Hello World! 2026'), 'hello-world-2026', 'Test 17a: normal slug');
  assertEqual(generateSlug('   ---Quiz @#$ Mania---  '), 'quiz-mania', 'Test 17b: cleans symbols and dashes');

  // ------------------------------------------------------------------------
  // Test 18: Canonical UUID & Secure Token Generation
  // ------------------------------------------------------------------------
  console.log('Scenario 18: UUID and Secure Tokens');
  const generatedUuid = generateCanonicalUuid();
  assert(isCanonicalUuid(generatedUuid), 'Test 18a: generateCanonicalUuid creates valid UUID');
  assert(!isCanonicalUuid('invalid-uuid-format'), 'Test 18b: rejects invalid UUID');
  assert(!isCanonicalUuid(null), 'Test 18c: rejects null');

  const tokenDefault = generateSecureToken();
  assert(tokenDefault.startsWith('tok_'), 'Test 18d: default token starts with tok_');
  const tokenCustom = generateSecureToken('session', 16);
  assert(tokenCustom.startsWith('session_'), 'Test 18e: custom prefix applied');

  // ------------------------------------------------------------------------
  // Test 19: Array Shuffle
  // ------------------------------------------------------------------------
  console.log('Scenario 19: Array Shuffle');
  assertEqual(shuffleArray([]).length, 0, 'Test 19a: shuffle empty array');
  const items = [1, 2, 3, 4, 5];
  const shuffled = shuffleArray(items);
  assertEqual(shuffled.length, 5, 'Test 19b: shuffle preserves length');
  assert(items.every(item => shuffled.includes(item)), 'Test 19c: shuffle preserves all elements');

  // ------------------------------------------------------------------------
  // Test 20: Short Text & True/False Questions in convertQuizJsonToQuiz
  // ------------------------------------------------------------------------
  console.log('Scenario 20: Question type conversion variations');
  const jsonVariants = JSON.stringify({
    id: '55555555-5555-4555-a555-555555555555',
    title: 'Variants Quiz',
    settings: { timer: false, allowReview: false },
    questions: [
      {
        question: 'Is the sky blue?',
        type: 'true_false',
        options: [
          { text: 'Yes', correct: true },
          { text: 'No', correct: false }
        ]
      },
      {
        question: 'Name a primary color',
        type: 'short_text',
        accepted_answers: ['red', 'blue', 'yellow']
      },
      {
        question: 'Select multiple evens',
        type: 'multiple_choice',
        options: [
          { text: '2', correct: true },
          { text: '4', correct: true }
        ]
      }
    ]
  });

  const resVariants = convertQuizJsonToQuiz(jsonVariants, '66666666-6666-4666-a666-666666666666');
  assert(resVariants.success, 'Test 20a: convert variants succeeds');
  assertEqual(resVariants.quiz?.id, '66666666-6666-4666-a666-666666666666', 'Test 20b: existingQuizId preserved');
  assertEqual(resVariants.quiz?.questions[0].options[0].option_text, 'Yes', 'Test 20c: true_false custom options preserved');
  assertEqual(resVariants.quiz?.questions[1].accepted_answers?.length, 3, 'Test 20d: short_text accepted answers preserved');
  assertEqual(resVariants.quiz?.questions[2].scoring_method, 'all_or_nothing', 'Test 20e: multiple_choice default scoring method set');
  assertEqual(resVariants.quiz?.settings.time_limit_minutes, null, 'Test 20f: timer false sets time_limit_minutes to null');

  // ------------------------------------------------------------------------
  // Test 21: convertQuizJsonToQuiz Validation Failures
  // ------------------------------------------------------------------------
  console.log('Scenario 21: Conversion rejection');
  const resInvalid = convertQuizJsonToQuiz({ not_a_valid_quiz: true });
  assert(!resInvalid.success && Array.isArray(resInvalid.errors), 'Test 21: invalid input produces structured errors');

  // ------------------------------------------------------------------------
  // Test 22: Question Validation Edge Cases
  // ------------------------------------------------------------------------
  console.log('Scenario 22: Question validation edge cases');
  // 22a. single_choice with < 2 options
  const valSingleFew = validateQuizJson({
    title: 'Few Options',
    questions: [{ question: 'Q?', type: 'single_choice', options: [{ text: '1', correct: true }] }]
  });
  assert(!valSingleFew.success && valSingleFew.errors?.some(e => e.includes('at least 2 options')), 'Test 22a: single_choice < 2 options rejected');

  // 22b. multiple_choice with < 2 options
  const valMultiFew = validateQuizJson({
    title: 'Few Options Multi',
    questions: [{ question: 'Q?', type: 'multiple_choice', options: [{ text: '1', correct: true }] }]
  });
  assert(!valMultiFew.success && valMultiFew.errors?.some(e => e.includes('at least 2 options')), 'Test 22b: multiple_choice < 2 options rejected');

  // 22c. multiple_choice with 0 correct options
  const valMultiNoCorrect = validateQuizJson({
    title: 'No Correct Multi',
    questions: [{ question: 'Q?', type: 'multiple_choice', options: [{ text: '1' }, { text: '2' }] }]
  });
  assert(!valMultiNoCorrect.success && valMultiNoCorrect.errors?.some(e => e.includes('at least one correct option')), 'Test 22c: multiple_choice 0 correct rejected');

  // 22d. true_false with != 2 options
  const valTfWrongCount = validateQuizJson({
    title: 'TF Wrong Count',
    questions: [{ question: 'Q?', type: 'true_false', options: [{ text: 'True', correct: true }, { text: 'False' }, { text: 'Maybe' }] }]
  });
  assert(!valTfWrongCount.success && valTfWrongCount.errors?.some(e => e.includes('exactly 2 options')), 'Test 22d: true_false with 3 options rejected');

  // 22e. true_false with 0 or 2 correct options
  const valTfTwoCorrect = validateQuizJson({
    title: 'TF 2 Correct',
    questions: [{ question: 'Q?', type: 'true_false', options: [{ text: 'True', correct: true }, { text: 'False', correct: true }] }]
  });
  assert(!valTfTwoCorrect.success && valTfTwoCorrect.errors?.some(e => e.includes('exactly one correct option')), 'Test 22e: true_false with 2 correct rejected');

  // 22f. short_text with no accepted answers when marks > 0
  const valShortNoAnswers = validateQuizJson({
    title: 'Short No Answers',
    questions: [{ question: 'Q?', type: 'short_text', marks: 5 }]
  });
  assert(!valShortNoAnswers.success && valShortNoAnswers.errors?.some(e => e.includes('at least one accepted answer')), 'Test 22f: short_text with no accepted answers rejected');

  // ------------------------------------------------------------------------
  // Test 23: Question Type Aliases & Accepted Answers Mapping
  // ------------------------------------------------------------------------
  console.log('Scenario 23: Question type aliases & options mapping');
  const jsonAliases = JSON.stringify({
    title: 'Aliases Quiz',
    questions: [
      {
        question: 'Short answer alias',
        type: 'short_answer',
        acceptedAnswers: ['answer1', 'answer2']
      },
      {
        question: 'Text answer alias',
        type: 'text_answer',
        options: [{ text: 'from_option', is_correct: true }]
      },
      {
        id: '11111111-1111-4111-a111-111111111111',
        question: 'Canonical ID preservation',
        type: 'single_choice',
        options: [
          { id: '22222222-2222-4222-a222-222222222222', text: 'Opt1', correct: true },
          { id: '33333333-3333-4333-a333-333333333333', text: 'Opt2' }
        ]
      }
    ]
  });
  const resAliases = convertQuizJsonToQuiz(jsonAliases);
  assert(resAliases.success, 'Test 23a: convert aliases succeeds');
  assertEqual(resAliases.quiz?.questions[0].question_type, 'short_text', 'Test 23b: short_answer mapped to short_text');
  assertEqual(resAliases.quiz?.questions[0].accepted_answers?.[0], 'answer1', 'Test 23c: acceptedAnswers mapped');
  assertEqual(resAliases.quiz?.questions[1].question_type, 'short_text', 'Test 23d: text_answer mapped to short_text');
  assertEqual(resAliases.quiz?.questions[1].accepted_answers?.[0], 'from_option', 'Test 23e: options accepted answers mapped');
  assertEqual(resAliases.quiz?.questions[2].id, '11111111-1111-4111-a111-111111111111', 'Test 23f: question UUID preserved');
  assertEqual(resAliases.quiz?.questions[2].options[0].id, '22222222-2222-4222-a222-222222222222', 'Test 23g: option UUID preserved');

  // ------------------------------------------------------------------------
  // Test 24: Crypto Fallback Branches
  // ------------------------------------------------------------------------
  console.log('Scenario 24: Crypto fallback branches');
  const origRandomUUID = globalThis.crypto.randomUUID;
  try {
    // Stub randomUUID to undefined so it uses getRandomValues branch
    (globalThis.crypto as any).randomUUID = undefined;
    const fallbackUuid = generateCanonicalUuid();
    assert(isCanonicalUuid(fallbackUuid), 'Test 24a: getRandomValues fallback generates canonical UUID');
  } finally {
    globalThis.crypto.randomUUID = origRandomUUID;
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runJsonImportTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
