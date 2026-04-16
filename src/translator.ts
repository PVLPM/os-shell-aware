// translator.ts - Command translation (bash → PowerShell)
import { shouldTranslateCommand, type TranslationRule } from './rules';

/**
 * Translates a bash command to PowerShell using the provided rules.
 * @param command - The command to translate
 * @param rules - Translation rules
 * @returns Translated command or original if no match or error
 */
export function translate(command: string, rules: TranslationRule[]): string {
  // Pass-through for empty commands
  if (!command || typeof command !== 'string') {
    return command;
  }

  // Don't translate if command already looks like PowerShell
  if (!shouldTranslateCommand(command)) {
    return command;
  }

  try {
    let result = command;

    for (const rule of rules) {
      if (rule.pattern && rule.replacement !== undefined) {
        result = result.replace(
          rule.pattern,
          rule.replacement as Parameters<String['replace']>[1]
        );
      }
    }

    return result;
  } catch (error) {
    // Silent failure - never break the agent (follows memorix.js pattern)
    console.error('[translator] Translation error:', (error as Error).message);
    return command;
  }
}

// Legacy export
export const translator = { translate };

export default { translate };