// index.ts - Plugin entry point
import type { Plugin } from '@opencode-ai/plugin';
import { detectEnvironment } from './detector.ts';
import { createRules, shouldTranslateCommand } from './rules.ts';
import { translate } from './translator.ts';
import { getReminder } from './reminders.ts';

const debug = Bun.env.OC_SHELL_AWARE_DEBUG === '1';

export const ShellAwarePlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // Detect environment once at startup
  const env = detectEnvironment();
  const rules = createRules(env);

  // Track reminder state (show only once per session)
  let reminderShown = false;

  function log(...args: (string | number | undefined)[]) {
    if (debug && client?.app?.log) {
      (client.app.log as (message: string, ...args: (string | number | undefined)[]) => void)('[shell-aware]', ...args);
    }
  }

  return {
    // Hook: shell.env - Inject platform context
    'shell.env': async (input, output) => {
      try {
        output.env.OC_PLATFORM = env.platform;
        output.env.OC_SHELL = env.shell;
        log('shell.env: injected platform=', env.platform, 'shell=', env.shell);
      } catch (error) {
        // Silent failure - never break the agent
        if (debug) console.error('[shell-aware] shell.env error:', (error as Error).message);
      }
    },

    // Hook: tool.execute.before - Translate bash commands to PowerShell
    'tool.execute.before': async (input, output) => {
      try {
        // Only translate bash commands when translation is needed
        if (input.tool !== 'bash' || !env.shouldTranslate) {
          return;
        }

        const command = output.args?.command as string | undefined;
        if (!command || typeof command !== 'string') {
          return;
        }

        // Skip if command already looks like PowerShell
        if (!shouldTranslateCommand(command)) {
          log('tool.execute.before: skipped (PowerShell detected)', command);
          return;
        }

        const translated = translate(command, rules);
        if (translated !== command) {
          output.args.command = translated;
          log('tool.execute.before: translated', command, '->', translated);
        }
      } catch (error) {
        // Silent failure - never break the agent
        if (debug) console.error('[shell-aware] tool.execute.before error:', (error as Error).message);
      }
    },

    // Hook: event - Handle session.created to inject build reminder once
    event: async ({ event }) => {
      try {
        if (event.type === 'session.created' && !reminderShown) {
          const reminder = getReminder(env.platform);
          if (reminder) {
            reminderShown = true;
            log('session.created: reminder shown for', env.platform);
            // Note: actual reminder injection depends on OpenCode's event system
            // The caller should use experimental.chat.system.transform with cadence=1
          }
        }
      } catch (error) {
        // Silent failure - never break the agent
        if (debug) console.error('[shell-aware] event error:', (error as Error).message);
      }
    },
  };
};

export default ShellAwarePlugin;