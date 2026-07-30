export interface CodeUnit {
  unitName: string;
  unitType: 'function' | 'class' | 'method';
  startLine: number; // 1-indexed
  endLine: number;   // 1-indexed, inclusive
}

/**
 * Parses source code on the client and returns named code units (functions, classes, methods) with line spans.
 */
export function parseCodeUnits(code: string, language: string): CodeUnit[] {
  const lang = language.toLowerCase().trim();
  const lines = code.split(/\r?\n/);

  if (lang === 'python' || lang === 'py') {
    return parsePythonUnits(lines);
  }

  return parseBraceUnits(lines, lang);
}

function parseBraceUnits(lines: string[], lang: string): CodeUnit[] {
  const units: CodeUnit[] = [];

  const jsFnDecl = /(?:export\s+)?(?:async\s+)?function(?:\s*\*|\s+)?([a-zA-Z0-9_$]+)/;
  const jsArrowFn = /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/;
  const jsClassDecl = /(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/;
  const jsMethodDecl = /^(?:\s*)(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/;
  const goFnDecl = /func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_$]+)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    let unitName: string | null = null;
    let unitType: 'function' | 'class' | 'method' = 'function';

    if (lang.includes('go')) {
      const match = line.match(goFnDecl);
      if (match && match[1]) {
        unitName = match[1];
        unitType = line.includes('func (') ? 'method' : 'function';
      }
    } else {
      const classMatch = line.match(jsClassDecl);
      const fnMatch = line.match(jsFnDecl);
      const arrowMatch = line.match(jsArrowFn);
      const methodMatch = line.match(jsMethodDecl);

      if (classMatch && classMatch[1]) {
        unitName = classMatch[1];
        unitType = 'class';
      } else if (fnMatch && fnMatch[1]) {
        unitName = fnMatch[1];
        unitType = 'function';
      } else if (arrowMatch && arrowMatch[1]) {
        unitName = arrowMatch[1];
        unitType = 'function';
      } else if (methodMatch && methodMatch[1] && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
        unitName = methodMatch[1];
        unitType = 'method';
      }
    }

    if (unitName) {
      const endLine = findBraceEndLine(lines, i);
      units.push({
        unitName,
        unitType,
        startLine: lineNum,
        endLine,
      });
    }
  }

  return units;
}

function findBraceEndLine(lines: string[], startIdx: number): number {
  let braceCount = 0;
  let started = false;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]!;
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '{') {
        braceCount++;
        started = true;
      } else if (char === '}') {
        braceCount--;
      }

      if (started && braceCount === 0) {
        return i + 1;
      }
    }
  }

  return startIdx + 1;
}

function parsePythonUnits(lines: string[]): CodeUnit[] {
  const units: CodeUnit[] = [];
  const pyDef = /^\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(/;
  const pyClass = /^\s*class\s+([a-zA-Z0-9_]+)\s*(?:\(|:)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    const defMatch = line.match(pyDef);
    const classMatch = line.match(pyClass);

    if (defMatch && defMatch[1]) {
      const unitName = defMatch[1];
      const indent = getIndentLevel(line);
      const isMethod = indent > 0;
      const endLine = findPythonEndLine(lines, i, indent);
      units.push({
        unitName,
        unitType: isMethod ? 'method' : 'function',
        startLine: lineNum,
        endLine,
      });
    } else if (classMatch && classMatch[1]) {
      const unitName = classMatch[1];
      const indent = getIndentLevel(line);
      const endLine = findPythonEndLine(lines, i, indent);
      units.push({
        unitName,
        unitType: 'class',
        startLine: lineNum,
        endLine,
      });
    }
  }

  return units;
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1]!.length : 0;
}

function findPythonEndLine(lines: string[], startIdx: number, baseIndent: number): number {
  let lastNonEmpty = startIdx + 1;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const indent = getIndentLevel(line);
    if (indent <= baseIndent) {
      return lastNonEmpty;
    }

    lastNonEmpty = i + 1;
  }

  return lastNonEmpty;
}
