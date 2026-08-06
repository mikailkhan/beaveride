import { LLMService, llmService } from '../services/llmService.js';
import type { LLMProvider, LLMVerificationResult } from '../services/llm/LLMProvider.js';

async function main() {
  console.log('--- Step 20.4 LLMService Orchestrator Test ---');

  // Test 1: Default singleton instance
  if (!llmService || typeof llmService.generatePlan !== 'function') {
    throw new Error('Default llmService singleton invalid');
  }
  console.log('✓ llmService singleton exported cleanly');

  // Test 2: Custom Provider Injection & Runtime Swapping
  class MockCustomProvider implements LLMProvider {
    async generatePlan(): Promise<string> {
      return 'Custom Plan';
    }
    async generateCode(): Promise<string> {
      return 'Custom Code';
    }
    async verifyCode(): Promise<LLMVerificationResult> {
      return { isValid: true, issues: [] };
    }
  }

  const customService = new LLMService(new MockCustomProvider());
  const plan = await customService.generatePlan('add feature', 'content', 'file.ts');
  if (plan !== 'Custom Plan') {
    throw new Error(`Expected "Custom Plan", got "${plan}"`);
  }
  console.log('✓ Constructor dependency injection works as expected');

  const code = await customService.generateCode('add feature', 'content', 'file.ts', 'plan');
  if (code !== 'Custom Code') {
    throw new Error(`Expected "Custom Code", got "${code}"`);
  }
  console.log('✓ Custom provider code generation delegated cleanly');

  // Test 3: Runtime swapping
  class MockAlternateProvider implements LLMProvider {
    async generatePlan(): Promise<string> {
      return 'Alternate Plan';
    }
    async generateCode(): Promise<string> {
      return 'Alternate Code';
    }
    async verifyCode(): Promise<LLMVerificationResult> {
      return { isValid: false, issues: ['test issue'] };
    }
  }

  customService.setProvider(new MockAlternateProvider());
  const altPlan = await customService.generatePlan('test', 'code', 'file.ts');
  if (altPlan !== 'Alternate Plan') {
    throw new Error(`Expected "Alternate Plan", got "${altPlan}"`);
  }
  console.log('✓ setProvider runtime swapping works dynamically');

  console.log('✓ Step 20.4 test passed successfully!');
}

main().catch((err) => {
  console.error('❌ Step 20.4 Test Failed:', err);
  process.exit(1);
});
