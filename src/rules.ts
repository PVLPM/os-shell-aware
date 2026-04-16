// rules.ts - Translation rules (bash → PowerShell)

/**
 * PowerShell cmdlet prefixes that indicate the command is already PowerShell
 */
const POWERSHELL_CMDLETS = [
  'Get-', 'Set-', 'New-', 'Remove-', 'Start-', 'Stop-', 'Test-',
  'Write-', 'Read-', 'Import-', 'Export-', 'Invoke-', 'Enter-', 'Exit-'
];

export interface TranslationRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
}

/**
 * Determines if a command looks like PowerShell and should NOT be translated.
 * @param command - The command to check
 * @returns true if the command should be translated (not a PowerShell cmdlet), false otherwise
 */
export function shouldTranslateCommand(command: string): boolean {
  const trimmed = command.trim();
  return !POWERSHELL_CMDLETS.some((cmd) => trimmed.startsWith(cmd));
}

/**
 * Creates translation rules based on environment.
 * @param env - Environment configuration
 * @param env.shouldTranslate - Whether translation is enabled
 * @returns Array of translation rules, or empty array if translation is disabled
 */
export function createRules(env: { shouldTranslate: boolean }): TranslationRule[] {
  // Only create rules if translation is needed
  if (!env.shouldTranslate) {
    return [];
  }

  return [
    // Rule 1: cmd1 && cmd2 → cmd1; if ($?) { cmd2 }
    {
      pattern: /^(.+?)\s+&&\s+(.+)$/,
      replacement: '$1; if ($?) { $2 }'
    },
    // Rule 2: $VAR → $env:VAR (standalone variable, not ${VAR})
    {
      pattern: /(?<!\$)\$([a-zA-Z_]\w*)\b/g,
      replacement: (match: string, varName: string): string => `$env:${varName}`
    },
    // Rule 3: export X=y → $env:X='y'
    {
      pattern: /^export\s+([a-zA-Z_]\w*)=(.+)$/,
      replacement: (match: string, key: string, value: string): string => `$env:${key}='${value.trim()}'`
    },
    // Rule 4: mkdir -p dir → mkdir dir -Force
    {
      pattern: /^mkdir\s+-p\s+(.+)$/,
      replacement: 'mkdir $1 -Force'
    },
    // Rule 5: rm -rf path → Remove-Item -Recurse -Force -Path path
    {
      pattern: /^rm\s+-rf\s+(.+)$/,
      replacement: 'Remove-Item -Recurse -Force -Path $1'
    },
    // Rule 6: cat file → Get-Content file
    {
      pattern: /^cat\s+(.+)$/,
      replacement: 'Get-Content $1'
    },
    // Rule 7: ls → Get-ChildItem
    {
      pattern: /^ls\s*$/,
      replacement: 'Get-ChildItem'
    }
  ];
}

// Legacy export
export const rules: TranslationRule[] = [];

export function addRule(pattern: RegExp, replacement: string | ((match: string, ...args: string[]) => string)): void {
  // Deprecated: use createRules(env) instead
}

export default { rules, createRules, addRule, shouldTranslateCommand };