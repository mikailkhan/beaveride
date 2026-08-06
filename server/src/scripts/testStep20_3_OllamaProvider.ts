import { OllamaProvider } from '../services/llm/OllamaProvider.js';

async function main() {
  console.log('--- Step 20.3 OllamaProvider Implementation Test ---');

  // Test 1: stripCodeFences utility
  const provider = new OllamaProvider();
  const fencedTS = '```typescript\nconst a = 1;\n```';
  const stripped = provider.stripCodeFences(fencedTS);
  if (stripped !== 'const a = 1;') {
    throw new Error(`stripCodeFences failed, expected "const a = 1;", got "${stripped}"`);
  }
  console.log('✓ stripCodeFences cleanly strips markdown code fences');

  // Test 2: Fallback handling when Ollama endpoint is unreachable
  const deadProvider = new OllamaProvider('http://127.0.0.1:59999', 'gemma');
  const mockPlan = await deadProvider.generatePlan('add validation', 'code', 'file.ts');
  if (!mockPlan.includes('Plan')) {
    throw new Error('Fallback generatePlan failed to return mock plan');
  }
  console.log('✓ generatePlan gracefully fell back to mock plan on dead endpoint');

  const mockCode = await deadProvider.generateCode('add validation', 'code', 'file.ts', 'plan');
  if (!mockCode.includes('BeaverBot Task:')) {
    throw new Error('Fallback generateCode failed to return mock code generator output');
  }
  console.log('✓ generateCode gracefully fell back to mock generator on dead endpoint');

  const verifyRes = await deadProvider.verifyCode('add validation', 'code', 'file.ts');
  if (!verifyRes.isValid) {
    throw new Error('Fallback verifyCode failed to return valid fallback');
  }
  console.log('✓ verifyCode gracefully fell back on dead endpoint');

  // Test 3: Live probe of local Ollama instance
  try {
    const livePlan = await provider.generatePlan('add addition function', 'export class Math {}', 'math.ts');
    console.log(`✓ Live Ollama generatePlan result: "${livePlan}"`);
  } catch (err: any) {
    console.log(`ℹ Live Ollama probe note: ${err?.message || err}`);
  }

  console.log('✓ Step 20.3 test completed successfully!');
}

main().catch((err) => {
  console.error('❌ Step 20.3 Test Failed:', err);
  process.exit(1);
});
