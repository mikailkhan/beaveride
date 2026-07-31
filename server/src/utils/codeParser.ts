import type { CodeUnit, LanguageGrammar } from './grammars/index.js';
import { getGrammarForLanguage } from './grammars/index.js';

export type { CodeUnit };

/**
 * Parses source code and returns named code units (functions, classes, methods) with line spans.
 * Supports JavaScript/TypeScript, Python, Go, Java, C/C++, C#, PHP, Ruby, Rust and generic brace fallbacks.
 */
export function parseCodeUnits(code: string, language: string): CodeUnit[] {
  const grammar = getGrammarForLanguage(language);
  const lines = code.split(/\r?\n/);

  if (grammar?.delimiterType === 'indentation') {
    return parseIndentationUnits(lines, grammar);
  } else if (grammar?.delimiterType === 'keyword_block') {
    return parseKeywordBlockUnits(lines, grammar);
  }

  return parseBraceGrammarUnits(lines, grammar);
}

function parseBraceGrammarUnits(lines: string[], grammar: LanguageGrammar | null): CodeUnit[] {
  const units: CodeUnit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    let unitName: string | null = null;
    let unitType: 'function' | 'class' | 'method' = 'function';

    if (grammar) {
      for (const pattern of grammar.patterns) {
        const match = line.match(pattern.regex);
        if (match && match[1]) {
          unitName = match[1];
          unitType = pattern.unitType;
          break;
        }
      }
    } else {
      // Fallback for unrecognized brace languages
      const defaultFn = /(?:export\s+)?(?:async\s+)?function(?:\s*\*|\s+)?([a-zA-Z0-9_$]+)/;
      const match = line.match(defaultFn);
      if (match && match[1]) {
        unitName = match[1];
        unitType = 'function';
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

function parseIndentationUnits(lines: string[], grammar: LanguageGrammar): CodeUnit[] {
  const units: CodeUnit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    for (const pattern of grammar.patterns) {
      const match = line.match(pattern.regex);
      if (match && match[1]) {
        const unitName = match[1];
        const indent = getIndentLevel(line);
        const endLine = findIndentationEndLine(lines, i, indent);
        units.push({
          unitName,
          unitType: pattern.unitType,
          startLine: lineNum,
          endLine,
        });
        break;
      }
    }
  }

  return units;
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1]!.length : 0;
}

function findIndentationEndLine(lines: string[], startIdx: number, baseIndent: number): number {
  let lastNonEmpty = startIdx + 1;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('//')) {
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

function parseKeywordBlockUnits(lines: string[], grammar: LanguageGrammar): CodeUnit[] {
  const units: CodeUnit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    for (const pattern of grammar.patterns) {
      const match = line.match(pattern.regex);
      if (match && match[1]) {
        const unitName = match[1];
        const endLine = findKeywordEndLine(lines, i);
        units.push({
          unitName,
          unitType: pattern.unitType,
          startLine: lineNum,
          endLine,
        });
        break;
      }
    }
  }

  return units;
}

function findKeywordEndLine(lines: string[], startIdx: number): number {
  let blockDepth = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (/^\b(def|class|if|unless|while|until|for|begin|case|do)\b/.test(line)) {
      blockDepth++;
    }
    if (/^\bend\b/.test(line)) {
      blockDepth--;
      if (blockDepth === 0) {
        return i + 1;
      }
    }
  }

  return startIdx + 1;
}
