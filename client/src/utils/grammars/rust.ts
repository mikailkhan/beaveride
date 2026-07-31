import type { LanguageGrammar } from './types';

export const rustGrammar: LanguageGrammar = {
  name: 'Rust',
  extensions: ['.rs'],
  aliases: ['rust', 'rs'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'class',
      regex: /(?:pub\s+)?(?:struct|enum|trait|impl)\s+([a-zA-Z0-9_]+)/,
    },
    {
      unitType: 'function',
      regex: /(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(/,
    },
  ],
};
