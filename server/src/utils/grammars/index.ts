import { LanguageGrammar } from './types.js';
import { javascriptGrammar } from './javascript.js';
import { pythonGrammar } from './python.js';
import { goGrammar } from './go.js';
import { javaGrammar } from './java.js';
import { cppGrammar } from './cpp.js';
import { csharpGrammar } from './csharp.js';
import { phpGrammar } from './php.js';
import { rubyGrammar } from './ruby.js';
import { rustGrammar } from './rust.js';

export * from './types.js';

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
