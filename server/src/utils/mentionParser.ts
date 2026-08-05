export interface MentionParseResult {
  isBotMention: boolean;
  instruction: string;
}

/**
 * Parses a chat message for a @BeaverBot trigger at the start of the message.
 * Case-insensitive match for @BeaverBot.
 */
export function parseBeaverBotMention(message: string): MentionParseResult {
  if (!message || typeof message !== 'string') {
    return { isBotMention: false, instruction: '' };
  }

  const trimmed = message.trim();
  const botPrefixRegex = /^@beaverbot(\s+|$)/i;

  if (botPrefixRegex.test(trimmed)) {
    const instruction = trimmed.replace(/^@beaverbot/i, '').trim();
    return {
      isBotMention: true,
      instruction,
    };
  }

  return { isBotMention: false, instruction: '' };
}
