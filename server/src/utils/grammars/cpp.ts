import { LanguageGrammar } from './types.js';

export const cppGrammar: LanguageGrammar = {
  name: 'C / C++',
  extensions: ['.c', '.cpp', '.h', '.hpp', '.cc', '.cxx'],
  aliases: ['c', 'cpp', 'c++', 'cxx'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'class',
      regex: /(?:class|struct)\s+([a-zA-Z0-9_]+)\s*(?::\s*(?:public|protected|private)\s+[a-zA-Z0-9_]+)?\s*\{/,
    },
    {
      unitType: 'function',
      regex: /(?:[a-zA-Z0-9_:]+\s+)+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/,
    },
  ],
};
