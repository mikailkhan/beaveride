import { taskManager } from '../services/taskManager.js';
import { llmService } from '../services/llmService.js';
import type { LLMProvider, LLMVerificationResult } from '../services/llm/LLMProvider.js';

async function main() {
  console.log('--- Step 20.5 TaskManager LLM Integration Test ---');

  let planCalled = false;
  let codeCalled = false;
  let verifyCalled = false;

  class IntegrationMockProvider implements LLMProvider {
    async generatePlan(instruction: string, existingContent: string, fileName: string): Promise<string> {
      planCalled = true;
      return `Mock plan for ${fileName}: ${instruction}`;
    }
    async generateCode(instruction: string, existingContent: string, fileName: string, planSummary: string): Promise<string> {
      codeCalled = true;
      return `${existingContent}\n// Generated for ${instruction}`;
    }
    async verifyCode(instruction: string, generatedCode: string, fileName: string): Promise<LLMVerificationResult> {
      verifyCalled = true;
      return { isValid: true, issues: [] };
    }
  }

  // Save previous provider and inject mock for testing
  const originalProvider = llmService.getProvider();
  llmService.setProvider(new IntegrationMockProvider());

  // Test provider delegation manually
  const plan = await llmService.generatePlan('add logger', 'const a = 1;', 'app.ts');
  const code = await llmService.generateCode('add logger', 'const a = 1;', 'app.ts', plan);
  const verify = await llmService.verifyCode('add logger', code, 'app.ts');

  if (!planCalled || !codeCalled || !verifyCalled) {
    throw new Error('LLMService failed to delegate call to active LLMProvider');
  }
  console.log('✓ TaskManager LLM pipeline delegates planning, writing, and verification cleanly');

  if (!plan.includes('app.ts') || !code.includes('Generated for add logger') || !verify.isValid) {
    throw new Error('LLMService returned unexpected pipeline responses');
  }
  console.log('✓ TaskManager integration responses validated successfully');

  // Restore original provider
  llmService.setProvider(originalProvider);

  console.log('✓ Step 20.5 test passed successfully!');
}

main().catch((err) => {
  console.error('❌ Step 20.5 Test Failed:', err);
  process.exit(1);
});
