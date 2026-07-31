import type { LanguageGrammar } from './types';

export const goGrammar: LanguageGrammar = {
  name: 'Go',
  extensions: ['.go'],
  aliases: ['go', 'golang'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'method',
      regex: /func\s+\([^)]+\)\s+([a-zA-Z0-9_]+)\s*\(/,
    },
    {
      unitType: 'function',
      regex: /func\s+([a-zA-Z0-9_]+)\s*\(/,
    },
  ],
};
