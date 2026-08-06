import { buildPlanPrompt, buildCodePrompt, buildVerifyPrompt } from '../utils/promptTemplates.js';
import type { LLMProvider, LLMVerificationResult } from '../services/llm/LLMProvider.js';

async function main() {
  console.log('--- Step 20.2 LLMProvider Interface & Prompt Templates Test ---');

  const fileName = 'calculator.ts';
  const instruction = 'add a subtract method';
  const existingContent = 'export class Calculator {\n  add(a: number, b: number): number {\n    return a + b;\n  }\n}';
  const planSummary = 'Add a subtract method returning the difference of two numbers.';

  const planPrompt = buildPlanPrompt(instruction, existingContent, fileName);
  if (!planPrompt.includes(instruction) || !planPrompt.includes(fileName)) {
    throw new Error('buildPlanPrompt failed to include instruction or fileName');
  }
  console.log('✓ buildPlanPrompt generated valid prompt structure');

  const codePrompt = buildCodePrompt(instruction, existingContent, fileName, planSummary);
  if (!codePrompt.includes('CRITICAL INSTRUCTIONS') || !codePrompt.includes(planSummary)) {
    throw new Error('buildCodePrompt failed to include critical instructions or planSummary');
  }
  console.log('✓ buildCodePrompt generated valid prompt structure');

  const verifyPrompt = buildVerifyPrompt(instruction, existingContent, fileName);
  if (!verifyPrompt.includes('"isValid"') || !verifyPrompt.includes(instruction)) {
    throw new Error('buildVerifyPrompt failed to include JSON schema or instruction');
  }
  console.log('✓ buildVerifyPrompt generated valid prompt structure');

  // Verify dummy mock class implementing LLMProvider interface type-checks cleanly
  class MockProvider implements LLMProvider {
    async generatePlan(instruction: string, existingContent: string, fileName: string): Promise<string> {
      return 'Mock plan';
    }
    async generateCode(
      instruction: string,
      existingContent: string,
      fileName: string,
      planSummary: string
    ): Promise<string> {
      return 'Mock code';
    }
    async verifyCode(
      instruction: string,
      generatedCode: string,
      fileName: string
    ): Promise<LLMVerificationResult> {
      return { isValid: true, issues: [] };
    }
  }

  const mock = new MockProvider();
  const res = await mock.verifyCode(instruction, 'code', fileName);
  if (!res.isValid) {
    throw new Error('MockProvider verification failed');
  }
  console.log('✓ LLMProvider interface contract satisfied by implementation');

  console.log('✓ Step 20.2 test passed successfully!');
}

main().catch((err) => {
  console.error('❌ Step 20.2 Test Failed:', err);
  process.exit(1);
});
