/**
 * Generates mock code for BeaverBot task execution.
 * Phase 20 will replace this with real LLM inference output.
 */
export function generateMockCode(instruction: string, existingContent: string): string {
  const sanitizeName = instruction
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  const fnName = sanitizeName ? `beaverBot_${sanitizeName}` : `beaverBotTask_${Date.now()}`;
  const timestamp = new Date().toISOString();

  const generatedBlock = `\n\n// BeaverBot Task: ${instruction}\n// Generated at: ${timestamp}\nexport function ${fnName}() {\n  // Auto-generated implementation by BeaverBot 🤖\n  console.log("Executing task: ${instruction.replace(/"/g, '\\"')}...");\n  return {\n    success: true,\n    task: "${instruction.replace(/"/g, '\\"')}",\n    executedAt: "${timestamp}"\n  };\n}\n`;

  return (existingContent || '').trimEnd() + generatedBlock;
}
