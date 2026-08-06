import { env } from '../config/env.js';
import { buildPlanPrompt, buildCodePrompt, buildVerifyPrompt } from '../utils/promptTemplates.js';
import { OllamaProvider } from '../services/llm/OllamaProvider.js';
import { LLMService, llmService } from '../services/llmService.js';
import type { LLMProvider, LLMVerificationResult } from '../services/llm/LLMProvider.js';

async function main() {
  console.log('====================================================');
  console.log('    PHASE 20 MASTER E2E TEST SUITE: LLM GENERATION');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // Scenario 1: Environment Configuration
  // --------------------------------------------------------------------------
  console.log('[Scenario 1/6] Environment Configuration Verification');
  if (typeof env.OLLAMA_BASE_URL !== 'string' || !env.OLLAMA_BASE_URL.startsWith('http')) {
    throw new Error(`Scenario 1 Failed: Invalid OLLAMA_BASE_URL: ${env.OLLAMA_BASE_URL}`);
  }
  if (typeof env.OLLAMA_MODEL !== 'string' || env.OLLAMA_MODEL.length === 0) {
    throw new Error(`Scenario 1 Failed: Invalid OLLAMA_MODEL: ${env.OLLAMA_MODEL}`);
  }
  console.log(`  ✓ OLLAMA_BASE_URL verified: ${env.OLLAMA_BASE_URL}`);
  console.log(`  ✓ OLLAMA_MODEL verified: ${env.OLLAMA_MODEL}\n`);

  // --------------------------------------------------------------------------
  // Scenario 2: LLMProvider Interface & Prompt Engineering
  // --------------------------------------------------------------------------
  console.log('[Scenario 2/6] Prompt Templates & Interface Verification');
  const planP = buildPlanPrompt('add add() method', 'class Calculator {}', 'calc.ts');
  const codeP = buildCodePrompt('add add() method', 'class Calculator {}', 'calc.ts', 'Plan summary');
  const verifyP = buildVerifyPrompt('add add() method', 'class Calculator { add() {} }', 'calc.ts');

  if (!planP.includes('calc.ts') || !codeP.includes('CRITICAL INSTRUCTIONS') || !verifyP.includes('"isValid"')) {
    throw new Error('Scenario 2 Failed: Prompt template construction error');
  }
  console.log('  ✓ Planning, writing, and verification prompts engineered cleanly\n');

  // --------------------------------------------------------------------------
  // Scenario 3: OllamaProvider Code Fence Stripping & Fallback Resilience
  // --------------------------------------------------------------------------
  console.log('[Scenario 3/6] OllamaProvider Sanitization & Offline Fallback');
  const provider = new OllamaProvider();
  const stripped = provider.stripCodeFences('```typescript\nconsole.log("hello");\n```');
  if (stripped !== 'console.log("hello");') {
    throw new Error(`Scenario 3 Failed: Code fence stripping failed, got "${stripped}"`);
  }

  const deadProvider = new OllamaProvider('http://127.0.0.1:59999', 'gemma');
  const fallbackPlan = await deadProvider.generatePlan('add feature', 'code', 'app.ts');
  const fallbackCode = await deadProvider.generateCode('add feature', 'code', 'app.ts', 'plan');
  const fallbackVerify = await deadProvider.verifyCode('add feature', 'code', 'app.ts');

  if (!fallbackPlan.includes('Plan') || !fallbackCode.includes('BeaverBot Task:') || !fallbackVerify.isValid) {
    throw new Error('Scenario 3 Failed: Offline endpoint fallback logic failed');
  }
  console.log('  ✓ OllamaProvider strips code fences and handles endpoint offline fallback cleanly\n');

  // --------------------------------------------------------------------------
  // Scenario 4: LLMService Orchestration & Dynamic Swapping
  // --------------------------------------------------------------------------
  console.log('[Scenario 4/6] LLMService Dependency Injection & Dynamic Swapping');
  let planCount = 0;
  class TestProvider implements LLMProvider {
    async generatePlan(): Promise<string> {
      planCount++;
      return 'Test Plan';
    }
    async generateCode(): Promise<string> {
      return 'Test Code';
    }
    async verifyCode(): Promise<LLMVerificationResult> {
      return { isValid: true, issues: [] };
    }
  }

  const originalProvider = llmService.getProvider();
  llmService.setProvider(new TestProvider());
  const resPlan = await llmService.generatePlan('test', 'code', 'file.ts');
  if (resPlan !== 'Test Plan' || planCount !== 1) {
    throw new Error('Scenario 4 Failed: Dynamic provider swapping or delegation failed');
  }
  llmService.setProvider(originalProvider);
  console.log('  ✓ LLMService orchestrates provider calls and supports runtime swapping\n');

  // --------------------------------------------------------------------------
  // Scenario 5: End-to-End LLM Pipeline Execution
  // --------------------------------------------------------------------------
  console.log('[Scenario 5/6] End-to-End Pipeline Validation');
  const e2ePlan = await llmService.generatePlan('add subtract method', 'class Calc {}', 'calc.ts');
  const e2eCode = await llmService.generateCode('add subtract method', 'class Calc {}', 'calc.ts', e2ePlan);
  const e2eVerify = await llmService.verifyCode('add subtract method', e2eCode, 'calc.ts');

  if (!e2ePlan || !e2eCode || typeof e2eVerify.isValid !== 'boolean') {
    throw new Error('Scenario 5 Failed: End-to-End LLM pipeline produced invalid output');
  }
  console.log('  ✓ Planning stage output: ' + e2ePlan.slice(0, 60) + '...');
  console.log('  ✓ Code generation stage output: ' + e2eCode.split('\n')[0]);
  console.log(`  ✓ Verification stage result: isValid=${e2eVerify.isValid}\n`);

  // --------------------------------------------------------------------------
  // Scenario 6: Backward Compatibility Check
  // --------------------------------------------------------------------------
  console.log('[Scenario 6/6] Backward Compatibility Verification');
  const mockFallbackCode = await deadProvider.generateCode('refactor function', 'function foo() {}', 'foo.ts', 'plan');
  if (!mockFallbackCode.includes('function foo() {}')) {
    throw new Error('Scenario 6 Failed: Backward compatibility with mock generator broken');
  }
  console.log('  ✓ Fallback path maintains full backward compatibility with mock generator\n');

  console.log('====================================================');
  console.log('  🎉 ALL 6 PHASE 20 MASTER E2E SCENARIOS PASSED!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('\n❌ Master E2E Test Suite Failed:', err);
  process.exit(1);
});
