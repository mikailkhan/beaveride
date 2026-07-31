import { LanguageGrammar } from './types.js';

export const pythonGrammar: LanguageGrammar = {
  name: 'Python',
  extensions: ['.py', '.pyw'],
  aliases: ['python', 'py'],
  delimiterType: 'indentation',
  patterns: [
    {
      unitType: 'class',
      regex: /^\s*class\s+([a-zA-Z0-9_]+)\s*(?:\(|:)/,
    },
    {
      unitType: 'function',
      regex: /^\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(/,
    },
  ],
};
