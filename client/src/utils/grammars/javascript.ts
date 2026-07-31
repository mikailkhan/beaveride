import type { LanguageGrammar } from './types';

export const javascriptGrammar: LanguageGrammar = {
  name: 'JavaScript / TypeScript',
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
  aliases: ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'],
  delimiterType: 'brace',
  patterns: [
    {
      unitType: 'class',
      regex: /(?:export\s+)?(?:default\s+)?class\s+([a-zA-Z0-9_$]+)/,
    },
    {
      unitType: 'function',
      regex: /(?:export\s+)?(?:default\s+)?(?:async\s+)?function(?:\s*\*|\s+)?([a-zA-Z0-9_$]+)/,
    },
    {
      unitType: 'function',
      regex: /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/,
    },
    {
      unitType: 'method',
      regex: /^\s*(?:public|private|protected|static|async)*\s*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/,
    },
  ],
};
