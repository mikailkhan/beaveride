import { computeContentHash, extractScopeContent, computeScopeHash, validateWriteFreshness } from '../utils/contentHash.js';

function runTests() {
  console.log('--- Testing Content Hash Utility ---');

  const fileContent = `function hello() {
  console.log("hello");
}

function world() {
  console.log("world");
}`;

  // 1. Test SHA-256 computation
  const hash1 = computeContentHash('hello');
  console.assert(hash1.length === 64, 'SHA-256 hash length should be 64 characters');
  console.log('✓ SHA-256 digest length check passed');

  // 2. Test File Scope Extraction
  const fileScope = extractScopeContent(fileContent, 'file');
  console.assert(fileScope === fileContent, 'File scope should match full file content');
  console.log('✓ File scope extraction passed');

  // 3. Test Function Scope Extraction (Lines 1 to 3)
  const fnScope = extractScopeContent(fileContent, 'function', 1, 3);
  const expectedFn = `function hello() {\n  console.log("hello");\n}`;
  console.assert(fnScope === expectedFn, `Extracted function scope mismatch.\nExpected:\n${expectedFn}\nGot:\n${fnScope}`);
  console.log('✓ Function scope extraction passed');

  // 4. Test Scope Hash Scope Isolation
  const fn1Hash = computeScopeHash(fileContent, 'function', 1, 3);
  const fn2Hash = computeScopeHash(fileContent, 'function', 5, 7);
  console.assert(fn1Hash !== fn2Hash, 'Hashes for different functions should differ');
  console.log('✓ Scope hash isolation passed');

  // 5. Test Freshness Validation (Current vs Stale vs No Hash)
  const lock = { lockScope: 'function' as const, startLine: 1, endLine: 3, contentHash: fn1Hash };
  const freshness1 = validateWriteFreshness(fileContent, lock);
  console.assert(freshness1.status === 'current', 'Should be current when content matches baseline');
  console.log('✓ Freshness check (current) passed');

  const modifiedContent = fileContent.replace('hello', 'helloModified');
  const freshness2 = validateWriteFreshness(modifiedContent, lock);
  console.assert(freshness2.status === 'stale', 'Should be stale when scope content changes');
  console.log('✓ Freshness check (stale) passed');

  const noHashLock = { lockScope: 'function' as const, startLine: 1, endLine: 3 };
  const freshness3 = validateWriteFreshness(fileContent, noHashLock);
  console.assert(freshness3.status === 'no_hash', 'Should return no_hash when baseline is missing');
  console.log('✓ Freshness check (no_hash) passed');

  console.log('\n✅ All Content Hash Utility tests passed successfully!');
}

runTests();
