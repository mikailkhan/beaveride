import type { LanguageGrammar } from './types';
import { javascriptGrammar } from './javascript';
import { pythonGrammar } from './python';
import { goGrammar } from './go';
import { javaGrammar } from './java';
import { cppGrammar } from './cpp';
import { csharpGrammar } from './csharp';
import { phpGrammar } from './php';
import { rubyGrammar } from './ruby';
import { rustGrammar } from './rust';

export type * from './types';

export const ALL_GRAMMARS: LanguageGrammar[] = [
  javascriptGrammar,
  pythonGrammar,
  goGrammar,
  javaGrammar,
  cppGrammar,
  csharpGrammar,
  phpGrammar,
  rubyGrammar,
  rustGrammar,
];

export function getGrammarForLanguage(languageOrExtension: string): LanguageGrammar | null {
  const query = languageOrExtension.toLowerCase().trim();

  for (const grammar of ALL_GRAMMARS) {
    if (
      grammar.aliases.includes(query) ||
      grammar.extensions.includes(query) ||
      grammar.extensions.includes(`.${query}`)
    ) {
      return grammar;
    }
  }

  return null;
}
