export type UnitType = 'function' | 'class' | 'method';

export interface GrammarPattern {
  unitType: UnitType;
  regex: RegExp;
}

export interface LanguageGrammar {
  name: string;
  extensions: string[];
  aliases: string[];
  delimiterType: 'brace' | 'indentation' | 'keyword_block';
  patterns: GrammarPattern[];
}

export interface CodeUnit {
  unitName: string;
  unitType: UnitType;
  startLine: number; // 1-indexed
  endLine: number;   // 1-indexed, inclusive
}
