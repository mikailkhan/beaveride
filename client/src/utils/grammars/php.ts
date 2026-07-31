import type { LanguageGrammar } from './types';

export const phpGrammar: LanguageGrammar = {
  name: 'PHP',
  extensions: ['.php', '.phtml'],
  aliases: ['php'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'class',
      regex: /(?:abstract\s+|final\s+)?class\s+([a-zA-Z0-9_]+)/,
    },
    {
      unitType: 'function',
      regex: /(?:public|protected|private|static|\s)*function\s+([a-zA-Z0-9_]+)\s*\(/,
    },
  ],
};
