import { createHash } from 'crypto';

/**
 * Computes a deterministic 64-character SHA-256 hex string digest from input content.
 */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Extracts scope content from a file string based on lock scope and line boundaries.
 * Lines are 1-indexed and inclusive.
 */
export function extractScopeContent(
  fullFileContent: string,
  lockScope: 'file' | 'function',
  startLine?: number,
  endLine?: number
): string {
  if (lockScope === 'file' || startLine === undefined || endLine === undefined) {
    return fullFileContent;
  }

  const lines = fullFileContent.split('\n');
  const totalLines = lines.length;

  if (totalLines === 0) return '';

  // Clamp 1-indexed lines to valid array boundaries
  const startIdx = Math.max(0, Math.min(startLine - 1, totalLines - 1));
  const endIdx = Math.max(startIdx, Math.min(endLine - 1, totalLines - 1));

  return lines.slice(startIdx, endIdx + 1).join('\n');
}

/**
 * Convenience helper that extracts scope content and computes its SHA-256 hash.
 */
export function computeScopeHash(
  fullFileContent: string,
  lockScope: 'file' | 'function',
  startLine?: number,
  endLine?: number
): string {
  const scopeContent = extractScopeContent(fullFileContent, lockScope, startLine, endLine);
  return computeContentHash(scopeContent);
}

export interface LockForFreshnessCheck {
  lockScope: 'file' | 'function';
  startLine?: number | undefined;
  endLine?: number | undefined;
  contentHash?: string | undefined;
}

export interface FreshnessResult {
  status: 'current' | 'stale' | 'no_hash';
  currentHash: string;
}

/**
 * Validates whether the current file scope matches the baseline content hash held by a lock.
 */
export function validateWriteFreshness(
  fullFileContent: string,
  lock: LockForFreshnessCheck
): FreshnessResult {
  const currentHash = computeScopeHash(fullFileContent, lock.lockScope, lock.startLine, lock.endLine);

  if (!lock.contentHash) {
    return { status: 'no_hash', currentHash };
  }

  if (lock.contentHash === currentHash) {
    return { status: 'current', currentHash };
  }

  return { status: 'stale', currentHash };
}
