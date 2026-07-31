import { LanguageGrammar } from './types.js';

export const csharpGrammar: LanguageGrammar = {
  name: 'C#',
  extensions: ['.cs'],
  aliases: ['csharp', 'cs'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'class',
      regex: /(?:public|protected|private|internal|static|abstract|sealed|\s)*class\s+([a-zA-Z0-9_]+)/,
    },
    {
      unitType: 'method',
      regex: /(?:public|protected|private|internal|static|async|virtual|override|abstract|\s)+[\w<>,\[\]\s]+\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/,
    },
  ],
};
