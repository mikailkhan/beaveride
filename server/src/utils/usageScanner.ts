export interface UsageSpan {
  fileId: number;
  fileName: string;
  startLine: number;  // 1-indexed
  endLine: number;    // 1-indexed, inclusive
  lineContent: string; // The actual line text for preview
  confidence: 'high' | 'medium';
}

export interface UsageScanResult {
  definitionFileId: number;
  unitName: string;
  usages: UsageSpan[];
  isComplete: boolean;  // false if scanner couldn't process all files
  warnings: string[];   // e.g., "Binary files were skipped"
}

interface FileContent {
  fileId: number;
  fileName: string;
  content: string;
}

/**
 * Scans all workspace files for usages of a named code unit.
 * 
 * IMPORTANT per PRD §7.2:
 * - The usage set MAY be incomplete
 * - The participant MUST be informed when confidence is limited
 * - This is a text-based search, not a full semantic analysis
 */
export function scanUsages(
  unitName: string,
  definitionFileId: number,
  allFiles: FileContent[]
): UsageScanResult {
  const usages: UsageSpan[] = [];
  const warnings: string[] = [];
  let isComplete = true;

  // Escape special regex characters in the unit name
  const escapedName = unitName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Pattern: Match the unit name as a whole word
  const usageRegex = new RegExp(
    `(?<![a-zA-Z0-9_$])${escapedName}(?![a-zA-Z0-9_$])`,
    'g'
  );

  for (const file of allFiles) {
    // Skip the definition file itself
    if (file.fileId === definitionFileId) continue;

    // Skip files with no content
    if (!file.content || file.content.trim() === '') continue;

    // Skip binary-looking files
    if (file.fileName.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp3|mp4|zip|tar|gz)$/i)) {
      continue;
    }

    try {
      const lines = file.content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const lineNum = i + 1;

        // Skip comment-only lines
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
          continue;
        }

        // Reset regex lastIndex for each line
        usageRegex.lastIndex = 0;

        if (usageRegex.test(line)) {
          // Skip lines that look like they ARE a definition line
          const isDefinition = new RegExp(
            `(?:function|class|def|func)\\s+${escapedName}\\b`
          ).test(line);

          if (!isDefinition) {
            usages.push({
              fileId: file.fileId,
              fileName: file.fileName,
              startLine: lineNum,
              endLine: lineNum,  // Single-line usage span
              lineContent: line.trim(),
              confidence: 'high',
            });
          }
        }
      }
    } catch (err) {
      warnings.push(`Failed to scan file "${file.fileName}" (id: ${file.fileId})`);
      isComplete = false;
    }
  }

  if (warnings.length > 0 || !isComplete) {
    warnings.unshift(
      'Usage detection is text-based and may be incomplete. ' +
      'Some references in comments, strings, or dynamic code may be missed.'
    );
  } else if (usages.length === 0) {
    warnings.push('No usages found in other files. The function may only be used in its definition file.');
  }

  return {
    definitionFileId,
    unitName,
    usages,
    isComplete,
    warnings,
  };
}
