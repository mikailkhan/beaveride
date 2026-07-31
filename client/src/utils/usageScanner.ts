export interface ClientUsageSpan {
  fileId: string;       // Client uses string IDs
  fileName: string;
  startLine: number;
  endLine: number;
  lineContent: string;
}

/**
 * Client-side usage scanner for preview purposes.
 * Scans all open workspace files for references to a unit name.
 */
export function scanUsagesClient(
  unitName: string,
  definitionFileId: string,
  allFiles: Array<{ id: string; name: string; content: string | null; type: string }>
): ClientUsageSpan[] {
  const usages: ClientUsageSpan[] = [];
  const escapedName = unitName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const usageRegex = new RegExp(
    `(?<![a-zA-Z0-9_$])${escapedName}(?![a-zA-Z0-9_$])`,
    'g'
  );

  for (const file of allFiles) {
    if (file.id === definitionFileId) continue;
    if (file.type !== 'file') continue;
    if (!file.content || file.content.trim() === '') continue;

    const lines = file.content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

      usageRegex.lastIndex = 0;
      if (usageRegex.test(line)) {
        const isDefinition = new RegExp(
          `(?:function|class|def|func)\\s+${escapedName}\\b`
        ).test(line);

        if (!isDefinition) {
          usages.push({
            fileId: file.id,
            fileName: file.name,
            startLine: i + 1,
            endLine: i + 1,
            lineContent: trimmed,
          });
        }
      }
    }
  }

  return usages;
}
