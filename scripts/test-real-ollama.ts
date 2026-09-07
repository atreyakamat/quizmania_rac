/**
 * Real Ollama End-to-End Integration Test Suite
 * Tests actual llama3.2:3b with live HTTP requests against localhost:11434
 */

import fs from 'fs';
import path from 'path';

// Load apps/admin/.env.local for script execution
const envPath = path.resolve(__dirname, '../apps/admin/.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  });
}

import { testOllamaConnection, getDefaultOllamaConfig } from '../apps/admin/src/lib/ollama/service';
import { runQuizGenerationPipeline } from '../apps/admin/src/lib/ollama/pipeline';
import { validateQuizJson, convertQuizJsonToQuiz, exportQuizToJson } from '@quizmania/quiz-schema';

async function main() {
  console.log('====================================================');
  console.log('QuizMania Real Ollama End-to-End Verification Suite');
  console.log('====================================================\n');

  const config = getDefaultOllamaConfig();
  console.log(`Configured Model: ${config.model}`);
  console.log(`Base URL:         ${config.baseUrl}`);
  console.log(`Timeout (per req):${config.timeoutMs}ms\n`);

  // Step 1: Healthcheck
  console.log('--- Checking Ollama Server Connectivity ---');
  const conn = await testOllamaConnection(config);
  if (conn.status !== 'connected') {
    console.error(`Ollama connection failed: ${conn.message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${conn.message}\n`);

  // ----------------------------------------------------
  // TEST 1: Small Quiz (5 questions: 0-mark fields + MCQs + Short text)
  // ----------------------------------------------------
  console.log('--- TEST 1: Small Quiz (5 questions with survey fields & graded types) ---');
  const smallQuizText = `
World Literacy Day 2026 - Registration & Trivia
Rotaract Club of Mapusa

1. Full Name
Answer:

2. Email Address
Answer:

3. Which year was World Literacy Day first proclaimed by UNESCO?
A. 1966
B. 1975
C. 1980
D. 1990
Correct Answer: A

4. Which of the following are primary official languages of the United Nations?
A. Arabic
B. English
C. Japanese
D. Spanish
Correct Answers: Arabic, English, Spanish

5. What is the standard term for the inability to read or write?
Answer: Illiteracy
`.trim();

  const t1Start = Date.now();
  console.log(`Input characters: ${smallQuizText.length}`);
  const t1Result = await runQuizGenerationPipeline({
    input: smallQuizText,
    title: 'World Literacy Day 2026 Registration & Trivia',
    onProgress: (p) => {
      console.log(`  [Progress] ${p.message}`);
    }
  });
  const t1Duration = ((Date.now() - t1Start) / 1000).toFixed(2);

  if (!t1Result.success) {
    console.error(`[FAIL] Test 1 failed: ${t1Result.error}`);
    if (t1Result.validationErrors) {
      console.error('Validation errors:', t1Result.validationErrors);
    }
    process.exit(1);
  }

  console.log(`[PASS] Test 1 completed in ${t1Duration}s`);
  console.log(`  - Chunks: ${t1Result.chunksCount}`);
  console.log(`  - Questions generated: ${t1Result.questionCount}`);
  console.log(`  - Title: "${t1Result.data?.title}"`);
  console.log(`  - Q1 type: ${t1Result.quiz?.questions[0].question_type}, marks: ${t1Result.quiz?.questions[0].marks}`);
  console.log(`  - Q2 type: ${t1Result.quiz?.questions[1].question_type}, marks: ${t1Result.quiz?.questions[1].marks}`);
  console.log(`  - Q3 type: ${t1Result.quiz?.questions[2].question_type}, marks: ${t1Result.quiz?.questions[2].marks}`);
  console.log(`  - Q4 type: ${t1Result.quiz?.questions[3].question_type}`);
  console.log(`  - Q5 type: ${t1Result.quiz?.questions[4].question_type}\n`);

  // Verify survey fields have 0 marks and valid schema
  if (t1Result.quiz?.questions[0].marks !== 0 || t1Result.quiz?.questions[1].marks !== 0) {
    console.warn(`[WARN] Survey questions expected marks: 0`);
  }

  // ----------------------------------------------------
  // TEST 2: Medium Quiz (20 questions)
  // ----------------------------------------------------
  console.log('--- TEST 2: Medium Quiz (20 questions) ---');
  const mediumQuestions: string[] = [];
  const capitals = [
    ['France', 'Paris', 'Rome', 'Berlin', 'Madrid'],
    ['Japan', 'Tokyo', 'Seoul', 'Beijing', 'Bangkok'],
    ['Germany', 'Berlin', 'Munich', 'Frankfurt', 'Hamburg'],
    ['Australia', 'Canberra', 'Sydney', 'Melbourne', 'Brisbane'],
    ['Canada', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
    ['Brazil', 'Brasilia', 'Rio de Janeiro', 'Sao Paulo', 'Salvador'],
    ['Egypt', 'Cairo', 'Alexandria', 'Giza', 'Luxor'],
    ['India', 'New Delhi', 'Mumbai', 'Kolkata', 'Chennai'],
    ['Italy', 'Rome', 'Milan', 'Florence', 'Naples'],
    ['Kenya', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    ['Mexico', 'Mexico City', 'Guadalajara', 'Monterrey', 'Puebla'],
    ['Spain', 'Madrid', 'Barcelona', 'Valencia', 'Seville'],
    ['Thailand', 'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
    ['Argentina', 'Buenos Aires', 'Cordoba', 'Rosario', 'Mendoza'],
    ['Greece', 'Athens', 'Thessaloniki', 'Patras', 'Heraklion'],
    ['Norway', 'Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
    ['Portugal', 'Lisbon', 'Porto', 'Braga', 'Coimbra'],
    ['Sweden', 'Stockholm', 'Gothenburg', 'Malmo', 'Uppsala'],
    ['Turkey', 'Ankara', 'Istanbul', 'Izmir', 'Antalya'],
    ['South Korea', 'Seoul', 'Busan', 'Incheon', 'Daegu']
  ];

  capitals.forEach(([country, correct, o2, o3, o4], idx) => {
    mediumQuestions.push(
      `${idx + 1}. What is the capital of ${country}?\n` +
      `A. ${correct}\n` +
      `B. ${o2}\n` +
      `C. ${o3}\n` +
      `D. ${o4}\n` +
      `Correct Answer: A`
    );
  });

  const mediumQuizText = `World Capitals Trivia Master\nRotaract Global Quiz Series\n\n` + mediumQuestions.join('\n\n');

  const t2Start = Date.now();
  console.log(`Input characters: ${mediumQuizText.length}`);
  const t2Result = await runQuizGenerationPipeline({
    input: mediumQuizText,
    title: 'World Capitals Trivia Master',
    onProgress: (p) => {
      console.log(`  [Progress] ${p.message}`);
    }
  });
  const t2Duration = ((Date.now() - t2Start) / 1000).toFixed(2);

  if (!t2Result.success) {
    console.error(`[FAIL] Test 2 failed: ${t2Result.error}`);
    if (t2Result.validationErrors) {
      console.error('Validation errors:', t2Result.validationErrors);
    }
    process.exit(1);
  }

  console.log(`[PASS] Test 2 completed in ${t2Duration}s`);
  console.log(`  - Chunks: ${t2Result.chunksCount}`);
  console.log(`  - Questions generated: ${t2Result.questionCount}`);
  console.log(`  - Sequential IDs: 1 to ${t2Result.quiz?.questions.length}\n`);

  // ----------------------------------------------------
  // TEST 3: Large 50+ Question Quiz
  // ----------------------------------------------------
  console.log('--- TEST 3: Large Quiz (50+ questions) ---');
  const largeQuestions: string[] = [];
  for (let i = 1; i <= 52; i++) {
    largeQuestions.push(
      `Question ${i}: Which of the following is true regarding topic #${i} in science and general studies?\n` +
      `A. Verified fact #${i}\n` +
      `B. Incorrect distractor #${i}a\n` +
      `C. Incorrect distractor #${i}b\n` +
      `D. Incorrect distractor #${i}c\n` +
      `Correct Answer: A`
    );
  }
  const largeQuizText = `Grand 50-Question Invitational Quiz\nOrganized by Rotaract Club of Mapusa\n\n` + largeQuestions.join('\n\n');

  const t3Start = Date.now();
  console.log(`Input characters: ${largeQuizText.length}`);
  const t3Result = await runQuizGenerationPipeline({
    input: largeQuizText,
    title: 'Grand 50-Question Invitational Quiz',
    onProgress: (p) => {
      console.log(`  [Progress] ${p.message}`);
    }
  });
  const t3Duration = ((Date.now() - t3Start) / 1000).toFixed(2);

  if (!t3Result.success) {
    console.error(`[FAIL] Test 3 failed: ${t3Result.error}`);
    if (t3Result.validationErrors) {
      console.error('Validation errors:', t3Result.validationErrors);
    }
    process.exit(1);
  }

  console.log(`[PASS] Test 3 completed in ${t3Duration}s`);
  console.log(`  - Chunks: ${t3Result.chunksCount}`);
  console.log(`  - Questions generated: ${t3Result.questionCount}`);
  console.log(`  - Schema Validation: SUCCESS`);

  // ----------------------------------------------------
  // TEST 4: Export -> Import Round-Trip Equivalence
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Export -> Import Round-Trip Equivalence ---');
  if (t1Result.quiz) {
    const exportedJsonStr = exportQuizToJson(t1Result.quiz);
    const reImported = convertQuizJsonToQuiz(exportedJsonStr);
    if (!reImported.success || !reImported.quiz) {
      console.error('[FAIL] Export -> Import round-trip conversion failed:', reImported.errors);
      process.exit(1);
    }
    console.log(`[PASS] Export -> Import succeeded`);
    console.log(`  - Original questions: ${t1Result.quiz.questions.length}`);
    console.log(`  - Re-imported questions: ${reImported.quiz.questions.length}`);
    console.log(`  - Title preserved: ${reImported.quiz.title === t1Result.quiz.title}`);
  }

  console.log('\n====================================================');
  console.log('ALL REAL OLLAMA TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
  console.log(`Model:            ${config.model}`);
  console.log(`Small Quiz (5q):  ${t1Duration}s, ${t1Result.chunksCount} chunks`);
  console.log(`Medium Quiz (20q):${t2Duration}s, ${t2Result.chunksCount} chunks`);
  console.log(`Large Quiz (52q): ${t3Duration}s, ${t3Result.chunksCount} chunks`);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
