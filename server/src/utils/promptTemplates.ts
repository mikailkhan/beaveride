/**
 * Builds the planning prompt asking the LLM to outline its strategy.
 */
export function buildPlanPrompt(instruction: string, existingContent: string, fileName: string): string {
  return `You are BeaverBot 🤖, a senior AI pair programmer embedded in BeaverIDE.
The user requested the following task on file "${fileName}":
"${instruction}"

Current file content:
\`\`\`
${existingContent}
\`\`\`

Provide a brief, concise 1-3 sentence plan describing what modifications or additions you will make to fulfill this instruction. Do NOT write code yet.
Based on the instruction and your knowledge, identify all file names that you need to modify.

Respond ONLY with a valid JSON object strictly matching this schema (no markdown, no code fences):
{
  "planSummary": "Your 1-3 sentence plan",
  "targetFiles": ["src/app.ts", "src/routes/auth.ts"]
}`;
}

/**
 * Builds the code generation prompt asking the LLM for full updated file content.
 */
export function buildCodePrompt(
  instruction: string,
  existingContent: string,
  fileName: string,
  planSummary: string
): string {
  return `You are BeaverBot 🤖, a senior AI pair programmer embedded in BeaverIDE.
Your goal is to complete the task on file "${fileName}".

Instruction: "${instruction}"
Approved Plan: "${planSummary}"

Existing File Content:
\`\`\`
${existingContent}
\`\`\`

CRITICAL INSTRUCTIONS:
1. Return ONLY the complete, executable source code for "${fileName}".
2. Do NOT wrap your output in markdown code fences (do NOT use \`\`\` or \`\`\`typescript).
3. Do NOT include explanations, introduction, markdown text, or conversational chatter.
4. Maintain all existing code style, imports, and structure except where changes are required by the instruction.
5. Your entire output will be inserted directly into the file buffer.`;
}

/**
 * Builds the verification prompt asking the LLM to review generated code against instruction.
 */
export function buildVerifyPrompt(instruction: string, generatedCode: string, fileName: string, planSummary: string = ''): string {
  return `You are BeaverBot 🤖, acting as a automated code reviewer.
Review the following generated code for file "${fileName}" against the user instruction and the execution plan.

User Instruction: "${instruction}"
Execution Plan: "${planSummary}"

Generated Code:
\`\`\`
${generatedCode}
\`\`\`

Evaluate if the code correctly and safely satisfies its responsibilities for the user instruction. 
CRITICAL NOTE: This task may involve multiple files. Do NOT fail the verification just because other files are missing. Evaluate ONLY if THIS specific file ("${fileName}") is implemented correctly according to the instruction and plan.

Respond ONLY with a valid JSON object strictly matching this schema (no markdown, no code fences):
{
  "isValid": true,
  "issues": []
}

If valid:
{"isValid": true, "issues": []}

If invalid or incomplete:
{"isValid": false, "issues": ["description of issue 1", "description of issue 2"]}`;
}
