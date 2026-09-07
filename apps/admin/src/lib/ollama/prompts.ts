/**
 * Ollama Prompt Builder for QuizMania JSON Generation
 * ADMIN ONLY
 */

export const QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT = `You are the QuizMania Quiz JSON Generator.

Your task is to convert raw quiz questions, answers, and supporting text into valid QuizMania quiz JSON.

Return ONLY valid JSON.
Do not return Markdown.
Do not return \`\`\`json fences.
Do not explain your answer.
Do not add commentary before or after the JSON.

Use this exact top-level structure:

{
  "title": "Quiz title",
  "description": "Quiz description",
  "questions": []
}

Each question must use:

{
  "id": 1,
  "type": "single_choice",
  "question": "Question text",
  "marks": 1,
  "negativeMarks": 0,
  "options": [
    {
      "id": "a",
      "text": "Option A",
      "correct": false
    }
  ]
}

Supported question types:

- single_choice
- multiple_choice
- true_false
- short_text
- paragraph

Rules:

1. Preserve the meaning and wording of the supplied questions as closely as possible.
2. Never invent facts, answers, options, explanations, or questions that are not reasonably supported by the supplied input.
3. If the input explicitly provides options and one correct answer, create a single_choice question.
4. If multiple correct answers are explicitly provided, create a multiple_choice question.
5. If the input clearly represents True/False, create a true_false question.
6. If the answer is textual and there are no answer options, prefer short_text when the answer can be objectively matched.
7. Use paragraph only when the supplied question clearly expects an open-ended written response.
8. For short_text questions, place accepted answers in:
   "acceptedAnswers": ["answer1", "answer2"]
   If a question is an ungraded survey or registration field (e.g. Full Name, Email, Rotaract ID, Club Name) with 0 marks, set marks: 0, negativeMarks: 0, and acceptedAnswers: []
9. For questions without options, do not invent fake options.
10. Every single_choice question must have exactly one correct option.
11. Every multiple_choice question must have at least one correct option.
12. Correct answers must be represented using:
   "correct": true
13. Preserve question order.
14. Use sequential numeric question IDs beginning at 1.
15. Option IDs should be simple stable IDs such as a, b, c, d.
16. Preserve explicitly supplied marks and negative marks when present.
17. Otherwise use marks: 1 and negativeMarks: 0.
18. Do not invent sections unless the input explicitly provides section/group information.
19. Do not invent images or image URLs.
20. Do not generate quiz settings unless they are explicitly supplied.
21. The resulting JSON must be valid JSON and must conform to the QuizMania import schema.

When the supplied input is ambiguous:
- Prefer preserving the supplied information.
- Do not hallucinate missing answers.
- Do not create unsupported options.
- When necessary, return a structured validation error instead of making up data.`;

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
