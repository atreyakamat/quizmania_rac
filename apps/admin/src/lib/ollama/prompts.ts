/**
 * Ollama Prompt Builder for QuizMania JSON Generation
 * ADMIN ONLY
 */

export const QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT = `You are the QuizMania Quiz JSON Generator.
Your SOLE purpose is converting raw quiz questions, answers, and text into valid QuizMania JSON.

Strict Output Rules:
- Return ONLY JSON.
- No Markdown formatting.
- No \`\`\`json or \`\`\` code fences.
- No explanation or commentary before or after the JSON.
- Start directly with { and end directly with }.

Top-level output structure:
{
  "title": "Quiz title",
  "description": "Quiz description",
  "questions": []
}

Question structure:
{
  "id": 1,
  "type": "single_choice",
  "question": "Question text here",
  "marks": 1,
  "negativeMarks": 0,
  "options": [
    {
      "id": "a",
      "text": "Option text",
      "correct": true
    },
    {
      "id": "b",
      "text": "Option text",
      "correct": false
    }
  ]
}

Supported question types:
- single_choice: exactly one correct answer
- multiple_choice: two or more correct answers
- true_false: clear True / False question (options: True and False)
- short_text: objective textual answer without options. Must use acceptedAnswers: ["answer1", "answer2"]
- paragraph: open-ended response without options.

Conversion Rules:
1. Preserve supplied question order exactly.
2. Preserve supplied answers exactly — never invent answers, never change correct answers.
3. Never invent options for questions that do not have options.
4. Never invent extra questions, and never duplicate questions.
5. Do not fabricate images or image URLs.
6. Do not invent unsupported settings.
7. Use sequential logical question IDs starting at 1 (1, 2, 3...).
8. Use simple option IDs (a, b, c, d...).
9. Use marks: 1 and negativeMarks: 0 when marks are not supplied.
10. Multiple correct answers => multiple_choice.
11. Exactly one correct answer => single_choice.
12. Clear true/false => true_false.
13. Objective textual answer => short_text with acceptedAnswers array.
14. Open-ended response => paragraph.
15. Never create fake options for short_text or paragraph questions.
16. For demographic/survey questions with 0 marks (e.g. Full Name, Email), use type "short_text", marks 0, negativeMarks 0, and acceptedAnswers [].

Input Format Support:
Robustly handle formats such as:
- Numbered questions with answers below:
  1. What is the capital of France?
  Answer: Paris
- Multiple-choice questions with letters:
  Q1. What is 2 + 2?
  A. 3
  B. 4
  C. 5
  Answer: B
- Labelled questions:
  Question:
  ...
  Answer:
  ...
- Mixed whitespace, irregular line breaks, and copied Word/plain-text formatting.`;

export const QUIZMANIA_JSON_SYSTEM_PROMPT = QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT;

export function buildRawTextConversionPrompt({
  input,
  title,
  description
}: {
  input: string;
  title?: string;
  description?: string;
}): string {
  let prompt = '';
  if (title?.trim()) {
    prompt += `Quiz Title: "${title.trim()}"\n`;
  }
  if (description?.trim()) {
    prompt += `Quiz Description: "${description.trim()}"\n`;
  }
  prompt += `\nRAW QUIZ CONTENT:\n${input.trim()}\n\nConvert the above content into valid QuizMania JSON conforming to the schema and rules. Output ONLY valid JSON starting with { and ending with }.`;
  return prompt;
}

export function buildChunkQuestionsPrompt({
  input,
  chunkIndex,
  totalChunks
}: {
  input: string;
  chunkIndex: number;
  totalChunks: number;
}): string {
  return `Convert the following questions (part ${chunkIndex} of ${totalChunks}) into valid QuizMania JSON question objects.
Return a JSON object containing ONLY the "questions" array:
{
  "questions": [
    {
      "id": 1,
      "type": "single_choice",
      "question": "Question text here",
      "marks": 1,
      "negativeMarks": 0,
      "options": [
        { "id": "a", "text": "First option", "correct": true },
        { "id": "b", "text": "Second option", "correct": false },
        { "id": "c", "text": "Third option", "correct": false },
        { "id": "d", "text": "Fourth option", "correct": false }
      ]
    }
  ]
}

Important Rules for every question:
1. Every single_choice and multiple_choice question MUST have at least 2 options. Include all options provided in the text.
2. For single_choice, exactly ONE option must have "correct": true.
3. For short_text questions, do not invent options; use "acceptedAnswers": ["..."].
4. For survey/demographic fields (Name, Email, etc.), use type: "short_text", marks: 0, negativeMarks: 0, acceptedAnswers: [].

RAW QUESTIONS CONTENT:
${input.trim()}

Output ONLY valid JSON starting with { and ending with }.`;
}

export function buildGenerationPrompt({
  sourceContent,
  instructions,
  mode,
}: {
  sourceContent: string;
  instructions?: string;
  mode: 'convert' | 'generate_from_topic' | 'add_distractors';
}): string {
  const modeInstructions = {
    convert: 'Convert the following question-and-answer content into QuizMania JSON. Preserve all questions and answers exactly.',
    generate_from_topic: 'Generate a quiz about the following topic. Create appropriate questions with plausible distractors.',
    add_distractors: 'For each question and correct answer below, generate 3 plausible but incorrect distractor options.',
  }[mode];
  
  let instructionsPart = '';
  if (instructions) {
    instructionsPart = 'Additional instructions: ' + instructions + '\n\n';
  }

  return modeInstructions + '\n\n' + instructionsPart + 'SOURCE CONTENT:\n' + sourceContent + '\n\nOutput ONLY the QuizMania JSON object. Start immediately with { and end with }.';
}
