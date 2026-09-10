import { test } from 'node:test';
import { extractJsonFromOllamaResponse } from '../service';
import { buildRawTextConversionPrompt, QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT } from '../prompts';
import { validateQuizJson, convertQuizJsonToQuiz } from '@quizmania/quiz-schema';

export async function runOllamaGeneratorTests() {
  console.log('\n========================================');
  console.log('Running Ollama AI Generator Tests');
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

  // 1. Prompt builder
  console.log('1. Testing Prompt Builder:');
  const prompt = buildRawTextConversionPrompt({
    input: '1. What is the capital of France?\nAnswer: Paris',
    title: 'European Capitals',
    description: 'A quiz on geography'
  });
  assert(prompt.includes('Quiz Title: "European Capitals"'), 'Prompt includes title');
  assert(prompt.includes('Quiz Description: "A quiz on geography"'), 'Prompt includes description');
  assert(prompt.includes('What is the capital of France?'), 'Prompt includes raw content');
  assert(QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT.includes('QuizMania Quiz JSON Generator'), 'System prompt contains persona');

  // 2. extractJsonFromOllamaResponse
  console.log('\n2. Testing JSON Extraction from Model Outputs:');
  
  // 2a. Direct JSON
  const directJson = '{"title":"Test","questions":[{"id":1,"question":"Q1","type":"single_choice","options":[{"id":"a","text":"A","correct":true},{"id":"b","text":"B","correct":false}]}]}';
  const extracted1 = extractJsonFromOllamaResponse(directJson);
  assert(extracted1 !== null, 'Direct JSON extracted');
  assertEqual(JSON.parse(extracted1!).title, 'Test', 'Direct JSON title matches');

  // 2b. Markdown code fences ```json ... ```
  const fencedJson = '```json\n{"title":"Fenced Quiz","questions":[{"id":1,"question":"Q1","type":"single_choice","options":[{"id":"a","text":"A","correct":true},{"id":"b","text":"B","correct":false}]}]}\n```';
  const extracted2 = extractJsonFromOllamaResponse(fencedJson);
  assert(extracted2 !== null, 'Fenced JSON extracted');
  assertEqual(JSON.parse(extracted2!).title, 'Fenced Quiz', 'Fenced JSON title matches');

  // 2c. Preamble & postamble with conversational text
  const conversationalResponse = `Hello! Here is the converted QuizMania JSON based on your raw questions:

\`\`\`json
{
  "title": "Conversational Quiz",
  "description": "Clean description",
  "questions": [
    {
      "id": 1,
      "question": "What is the capital of France?",
      "type": "single_choice",
      "marks": 1,
      "negativeMarks": 0,
      "options": [
        { "id": "a", "text": "Paris", "correct": true },
        { "id": "b", "text": "Lyon", "correct": false }
      ]
    }
  ]
}
\`\`\`

Let me know if you need anything else!`;

  const extracted3 = extractJsonFromOllamaResponse(conversationalResponse);
  assert(extracted3 !== null, 'Conversational response extracted');
  assertEqual(JSON.parse(extracted3!).title, 'Conversational Quiz', 'Extracted JSON parses with correct title');

  // 2d. Plain text without JSON returns null
  const plainTextResponse = 'I apologize, but I cannot generate a quiz from that text.';
  const extracted4 = extractJsonFromOllamaResponse(plainTextResponse);
  assert(extracted4 === null, 'Plain text with no JSON returns null');

  // 3. End-to-end simulated AI conversion of the 3 sample questions
  console.log('\n3. Testing End-to-End Normalization for Example Input:');
  const simulatedAiOutput = `{
    "title": "General Knowledge Trivia",
    "description": "Generated trivia quiz",
    "questions": [
      {
        "id": 1,
        "question": "What is the capital of France?",
        "type": "single_choice",
        "marks": 5,
        "negativeMarks": 0,
        "options": [
          { "id": "a", "text": "Paris", "correct": true },
          { "id": "b", "text": "London", "correct": false },
          { "id": "c", "text": "Berlin", "correct": false },
          { "id": "d", "text": "Madrid", "correct": false }
        ]
      },
      {
        "id": 2,
        "question": "Which planet is known as the Red Planet?",
        "type": "single_choice",
        "marks": 5,
        "negativeMarks": 0,
        "options": [
          { "id": "a", "text": "Mars", "correct": true },
          { "id": "b", "text": "Venus", "correct": false },
          { "id": "c", "text": "Jupiter", "correct": false },
          { "id": "d", "text": "Saturn", "correct": false }
        ]
      },
      {
        "id": 3,
        "question": "Which of the following are programming languages?",
        "type": "multiple_choice",
        "marks": 5,
        "negativeMarks": 0,
        "options": [
          { "id": "a", "text": "Python", "correct": true },
          { "id": "b", "text": "JavaScript", "correct": true },
          { "id": "c", "text": "HTML", "correct": false },
          { "id": "d", "text": "CSS", "correct": false }
        ]
      }
    ]
  }`;

  // Step A: validate with validateQuizJson
  const validation = validateQuizJson(simulatedAiOutput);
  assert(validation.success === true, 'Validation of AI output succeeds');
  assertEqual(validation.data?.questions.length, 3, 'Validation reports 3 questions');

  // Step B: convert with convertQuizJsonToQuiz
  const conversion = convertQuizJsonToQuiz(simulatedAiOutput);
  assert(conversion.success === true, 'Conversion of AI output succeeds');
  assert(conversion.quiz !== undefined, 'Quiz model produced');
  const convertedQuiz = conversion.quiz;
  if (!convertedQuiz?.questions) throw new Error('Quiz or questions is undefined');
  const questions = convertedQuiz.questions;
  assertEqual(questions.length, 3, 'Quiz has 3 questions');
  assertEqual(questions[0].question_text, 'What is the capital of France?', 'Q1 text matches');
  assertEqual(questions[0].question_type, 'single_choice', 'Q1 is single_choice');
  assertEqual(questions[0].options?.[0]?.is_correct, true, 'Q1 option Paris is correct');
  assertEqual(questions[1].question_text, 'Which planet is known as the Red Planet?', 'Q2 text matches');
  assertEqual(questions[2].question_type, 'multiple_choice', 'Q3 is multiple_choice');
  assertEqual(conversion.summary?.questionsCount, 3, 'Summary questions count is 3');
  assertEqual(conversion.summary?.optionsCount, 12, 'Summary options count is 12');

  // 4. Testing splitIntoQuestionChunks
  console.log('\n4. Testing Question Chunking:');
  const { splitIntoQuestionChunks } = await import('../chunker');

  // 4a. Short text should be single chunk
  const shortText = '1. Question one?\nAnswer: Yes\n2. Question two?\nAnswer: No';
  const shortChunks = splitIntoQuestionChunks(shortText, 1200);
  assertEqual(shortChunks.length, 1, 'Short text stays in 1 chunk');

  // 4b. Long text with 10 questions should split along question boundaries
  const longQuestions = Array.from({ length: 12 }, (_, i) => 
    `Question ${i + 1}: What is fact #${i + 1} about world history and modern civilization?\nA) Option Alpha ${i + 1}\nB) Option Beta ${i + 1}\nC) Option Gamma ${i + 1}\nD) Option Delta ${i + 1}\nAnswer: Option Alpha ${i + 1}`
  ).join('\n\n');
  const longChunks = splitIntoQuestionChunks(longQuestions, 600);
  assert(longChunks.length > 1, 'Long text splits into multiple chunks');
  assert(longChunks.every(c => c.length <= 600), 'All chunks stay strictly within hard limit <= 600');
  assert(longChunks.join('') === longQuestions, 'No characters skipped or overlapped');
  // Check question boundary preservation (no chunk starts mid-option)
  assert(longChunks[1].trimStart().startsWith('Question '), 'Chunk 2 starts at question boundary');

  // 4c. Empty text returns empty array
  const emptyChunks = splitIntoQuestionChunks('', 600);
  assertEqual(emptyChunks.length, 0, 'Empty text returns empty chunk array');

  // 4d. Unbroken text without newlines splits at hard limit
  const unbrokenText = 'A'.repeat(500);
  const unbrokenChunks = splitIntoQuestionChunks(unbrokenText, 200);
  assert(unbrokenChunks.length === 3, 'Unbroken text splits at hard limit');
  assertEqual(unbrokenChunks.join(''), unbrokenText, 'Unbroken text reconstructs perfectly');

  // 4e. Text with safe newlines but no question markers
  const plainParagraphs = 'First long paragraph of context.\n\nSecond long paragraph of context.\n\nThird long paragraph.';
  const paragraphChunks = splitIntoQuestionChunks(plainParagraphs, 40);
  assert(paragraphChunks.length > 1, 'Splits along safe newline/paragraph boundaries');
  assertEqual(paragraphChunks.join(''), plainParagraphs, 'Paragraph chunks reconstruct perfectly');

  // 5. Testing Multi-chunk Merge & Re-index
  console.log('\n5. Testing Multi-chunk Merge and Re-index:');
  const chunk1Questions = [
    { id: 1, type: 'short_text', question: 'Full Name', marks: 0, negativeMarks: 0, required: true, acceptedAnswers: [''] },
    { id: 2, type: 'short_text', question: 'Email Address', marks: 0, negativeMarks: 0, required: true, acceptedAnswers: [''] }
  ];
  const chunk2Questions = [
    { id: 1, type: 'single_choice', question: 'First question?', marks: 1, options: [{ id: 'a', text: 'A', correct: true }, { id: 'b', text: 'B', correct: false }] },
    { id: 2, type: 'single_choice', question: 'Second question?', marks: 1, options: [{ id: 'a', text: 'X', correct: true }, { id: 'b', text: 'Y', correct: false }] }
  ];

  const mergedAll = [...chunk1Questions, ...chunk2Questions];
  mergedAll.forEach((q, idx) => { q.id = idx + 1; });

  const mergedQuizObj = {
    title: 'Literacy Day Quiz 2026',
    description: 'Rotaract Club of Mapusa',
    questions: mergedAll
  };

  const { mergeChunkResults } = await import('../pipeline');

  const deterministicMerged = mergeChunkResults([
    {
      title: 'Generated Quiz', // generic, should be superseded if valid title in chunk 2 or user
      description: 'First batch',
      questions: [{ id: 1, type: 'single_choice', question: 'Q1', options: [{ id: 'a', text: 'A', correct: true }] }],
      sections: [{ id: 'sec-1', title: 'Round 1' }],
      settings: { timeLimitMinutes: 20 }
    },
    {
      title: 'World Geography Masters', // non-generic, should win
      description: 'Second batch',
      questions: [{ id: 1, type: 'single_choice', question: 'Q2', options: [{ id: 'a', text: 'B', correct: true }] }],
      sections: [{ id: 'sec-2', title: 'Round 2' }],
      settings: { passingScorePercentage: 70 }
    }
  ]);

  assertEqual(deterministicMerged.title, 'World Geography Masters', 'Non-generic title wins over generic');
  assertEqual(deterministicMerged.questions.length, 2, 'Total questions merged');
  assertEqual(deterministicMerged.questions[0].id, 1, 'Q1 id is 1');
  assertEqual(deterministicMerged.questions[1].id, 2, 'Q2 id is 2 (re-indexed)');
  assertEqual(deterministicMerged.sections.length, 2, 'Both sections merged');
  assertEqual(deterministicMerged.settings.timeLimitMinutes, 20, 'Settings timeLimitMinutes preserved');
  assertEqual(deterministicMerged.settings.passingScorePercentage, 70, 'Settings passingScorePercentage preserved');

  // 6. Testing Pipeline Error Contracts
  console.log('\n6. Testing Pipeline Error Contracts:');
  const { executeQuizGenerationPipeline } = await import('../pipeline');

  // Test 6a: Disabled error contract
  const resDisabled = await executeQuizGenerationPipeline(
    { input: '1. What is 2+2?' },
    { baseUrl: 'http://localhost:11434', model: 'llama3.2:3b', timeoutMs: 1000, enabled: false }
  );
  assertEqual(resDisabled.success, false, 'Pipeline returns success false when disabled');
  assertEqual(resDisabled.error, 'Ollama AI generation is currently disabled.', 'Error message when disabled matches contract');

  // Test 6b: Unavailable error contract (non-existent port)
  const resUnavailable = await executeQuizGenerationPipeline(
    { input: '1. What is 2+2?' },
    { baseUrl: 'http://127.0.0.1:59999', model: 'llama3.2:3b', timeoutMs: 500, enabled: true }
  );
  assertEqual(resUnavailable.success, false, 'Pipeline returns success false when unreachable');
  assertEqual(resUnavailable.error, 'Ollama is unavailable. Make sure Ollama is running and the configured model is installed.', 'Error message when unreachable matches contract');

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOllamaGeneratorTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
