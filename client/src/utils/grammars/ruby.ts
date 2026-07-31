import type { LanguageGrammar } from './types';

export const rubyGrammar: LanguageGrammar = {
  name: 'Ruby',
  extensions: ['.rb'],
  aliases: ['ruby', 'rb'],
  delimiterType: 'keyword_block',
  patterns: [
    {
      unitType: 'class',
      regex: /^\s*class\s+([a-zA-Z0-9_:]+)/,
    },
    {
      unitType: 'function',
      regex: /^\s*def\s+([a-zA-Z0-9_?!.]+)/,
    },
  ],
};
