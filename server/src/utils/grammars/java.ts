import { LanguageGrammar } from './types.js';

export const javaGrammar: LanguageGrammar = {
  name: 'Java',
  extensions: ['.java'],
  aliases: ['java'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'class',
      regex: /(?:public|protected|private|static)?\s*class\s+([a-zA-Z0-9_$]+)/,
    },
    {
      unitType: 'method',
      regex: /(?:public|protected|private|static|final|synchronized|abstract|\s)+[\w<>,\[\]\s]+\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*\{/,
    },
  ],
};
