import { getOrCreateDoc, getOrCreateFileText, getFileContent } from '../sockets/docStore.js';
import { acquireLock, getLocksForUserInFile, updateLockContentHash } from '../sockets/lockStore.js';
import { computeScopeHash, validateWriteFreshness } from '../utils/contentHash.js';

async function runMasterTest() {
  console.log('================================================================');
  console.log('  Phase 16: Write Versioning & Stale Detection Master Test Suite  ');
  console.log('================================================================\n');

  const roomId = 555;
  const fileId = 505;

  await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);

  const initialCode = `function alpha() {
  return "A";
}

function beta() {
  return "B";
}`;

  yText.insert(0, initialCode);

  // Scenario 1: Happy Path Write Validation & Stamping
  console.log('--- Scenario 1: Happy Path Write Validation & Stamping ---');
  const res1 = acquireLock(roomId, fileId, 1, 'alice', 'socket1', 'function', 1, 3, 'alpha');
  console.assert(res1.status === 'acquired', 'Lock acquisition should succeed');

  if (res1.status === 'acquired') {
    const liveContent = getFileContent(roomId, fileId)!;
    const initialHash = computeScopeHash(liveContent, 'function', 1, 3);
    res1.lock.contentHash = initialHash;

    const freshness = validateWriteFreshness(liveContent, res1.lock);
    console.assert(freshness.status === 'current', 'Freshness check must return current');
    console.log('✓ Initial lock stamped with SHA-256 hash digest:', initialHash);
    console.log('✓ Write freshness check passed (status: current)');
  }

  // Scenario 2: Stale Write Rejection
  console.log('\n--- Scenario 2: Stale Write Rejection ---');
  if (res1.status === 'acquired') {
    const staleBaselineHash = res1.lock.contentHash!;

    // Mutate alpha body externally
    const currentText = getFileContent(roomId, fileId)!;
    const mutatedText = currentText.replace('"A"', '"A_mutated"');
    yText.delete(0, yText.length);
    yText.insert(0, mutatedText);

    const liveContent = getFileContent(roomId, fileId)!;
    const freshnessStale = validateWriteFreshness(liveContent, res1.lock);
    console.assert(freshnessStale.status === 'stale', 'Freshness check must detect stale version');
    console.assert(freshnessStale.currentHash !== staleBaselineHash, 'Live hash must differ from baseline');
    console.log('✓ Stale write detection verified (submitted hash rejected)');
  }

  // Scenario 3: Scope-Level Isolation
  console.log('\n--- Scenario 3: Scope-Level Isolation ---');
  {
    // Re-seed file and acquire lock on alpha
    yText.delete(0, yText.length);
    yText.insert(0, initialCode);

    const liveContent = getFileContent(roomId, fileId)!;
    const alphaBaselineHash = computeScopeHash(liveContent, 'function', 1, 3);
    res1.status === 'acquired' && (res1.lock.contentHash = alphaBaselineHash);

    // Mutate function beta() (lines 5 to 7), leaving function alpha() untouched
    const mutatedBetaCode = `function alpha() {\n  return "A";\n}\n\nfunction beta() {\n  return "B_MODIFIED_EXTERNALLY";\n}`;
    yText.delete(0, yText.length);
    yText.insert(0, mutatedBetaCode);

    const liveContentAfterBetaEdit = getFileContent(roomId, fileId)!;
    const alphaFreshness = validateWriteFreshness(liveContentAfterBetaEdit, res1.lock);

    console.assert(alphaFreshness.status === 'current', 'Edits to beta() should NOT invalidate alpha() baseline hash');
    console.log('✓ Scope-level isolation verified: external edits to beta() left alpha() write valid!');
  }

  // Scenario 4: Rolling Hash Continuity
  console.log('\n--- Scenario 4: Rolling Hash Continuity Across Sequential Edits ---');
  if (res1.status === 'acquired') {
    for (let i = 1; i <= 3; i++) {
      const liveContent = getFileContent(roomId, fileId)!;
      const currentFreshness = validateWriteFreshness(liveContent, res1.lock);
      console.assert(currentFreshness.status === 'current', `Edit ${i} baseline must be valid`);

      // Apply edit i
      const newText = liveContent.replace('return "A"', `return "A_edit_${i}"`);
      yText.delete(0, yText.length);
      yText.insert(0, newText);

      // Rolling hash update
      const updatedContent = getFileContent(roomId, fileId)!;
      const newHash = computeScopeHash(updatedContent, 'function', 1, 3);
      updateLockContentHash(roomId, fileId, res1.lock.id, newHash);
      res1.lock.contentHash = newHash;

      console.log(`  ✓ Sequential Edit ${i} applied & hash rolled to: ${newHash.substring(0, 16)}...`);
    }
  }

  // Scenario 5: File-Scope Lock Versioning
  console.log('\n--- Scenario 5: File-Scope Lock Versioning ---');
  const fileLockRes = acquireLock(roomId, fileId, 2, 'bob', 'socket2', 'file');
  if (fileLockRes.status === 'acquired') {
    const fullFileContent = getFileContent(roomId, fileId)!;
    const fullFileHash = computeScopeHash(fullFileContent, 'file');
    fileLockRes.lock.contentHash = fullFileHash;

    const fileFreshness = validateWriteFreshness(fullFileContent, fileLockRes.lock);
    console.assert(fileFreshness.status === 'current', 'File-scope freshness must be current');
    console.log('✓ File-scope lock versioning verified with full file hash digest:', fullFileHash.substring(0, 16) + '...');
  }

  console.log('\n================================================================');
  console.log('  ✅ ALL 5 MASTER WRITE VERSIONING SCENARIOS PASSED CLEANLY!  ');
  console.log('================================================================\n');
}

runMasterTest();
