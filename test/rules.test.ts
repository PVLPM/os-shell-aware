import { describe, it, expect } from 'bun:test';
import { shouldTranslateCommand, createRules } from '../src/rules';

describe('shouldTranslateCommand', () => {
  it('returns false for PowerShell cmdlets with Get- prefix', () => {
    expect(shouldTranslateCommand('Get-Process')).toBe(false);
    expect(shouldTranslateCommand('Get-Item')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Set- prefix', () => {
    expect(shouldTranslateCommand('Set-Location')).toBe(false);
    expect(shouldTranslateCommand('Set-Variable')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with New- prefix', () => {
    expect(shouldTranslateCommand('New-Item')).toBe(false);
    expect(shouldTranslateCommand('New-Object')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Remove- prefix', () => {
    expect(shouldTranslateCommand('Remove-Item')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Start- prefix', () => {
    expect(shouldTranslateCommand('Start-Process')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Stop- prefix', () => {
    expect(shouldTranslateCommand('Stop-Process')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Test- prefix', () => {
    expect(shouldTranslateCommand('Test-Path')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Write- prefix', () => {
    expect(shouldTranslateCommand('Write-Host')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Read- prefix', () => {
    expect(shouldTranslateCommand('Read-Host')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Import- prefix', () => {
    expect(shouldTranslateCommand('Import-Module')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Export- prefix', () => {
    expect(shouldTranslateCommand('Export-ModuleMember')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Invoke- prefix', () => {
    expect(shouldTranslateCommand('Invoke-Command')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Enter- prefix', () => {
    expect(shouldTranslateCommand('Enter-PSSession')).toBe(false);
  });

  it('returns false for PowerShell cmdlets with Exit- prefix', () => {
    expect(shouldTranslateCommand('Exit-PSSession')).toBe(false);
  });

  it('returns true for bash commands', () => {
    expect(shouldTranslateCommand('ls')).toBe(true);
    expect(shouldTranslateCommand('cat file.txt')).toBe(true);
    expect(shouldTranslateCommand('mkdir -p test')).toBe(true);
  });

  it('trims whitespace before checking', () => {
    expect(shouldTranslateCommand('  Get-Process')).toBe(false);
    expect(shouldTranslateCommand('  ls')).toBe(true);
  });
});

describe('createRules', () => {
  it('returns empty array when shouldTranslate is false', () => {
    const rules = createRules({ shouldTranslate: false });
    expect(rules).toEqual([]);
  });

  it('returns 7 rules when shouldTranslate is true', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(rules).toHaveLength(7);
  });

  describe('Rule 1: && chain translation', () => {
    it('translates && to ; if ($?) { } pattern', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'echo hello && echo world'.replace(rules[0]!.pattern, rules[0]!.replacement as string);
      expect(result).toBe('echo hello; if ($?) { echo world }');
    });
  });

  describe('Rule 2: variable translation', () => {
    it('translates $VAR to $env:VAR', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'echo $HOME'.replace(rules[1]!.pattern, rules[1]!.replacement as (match: string, ...args: string[]) => string);
      expect(result).toBe('echo $env:HOME');
    });

    it('does not translate ${VAR} syntax', () => {
      const rules = createRules({ shouldTranslate: true });
      const input = 'echo ${HOME}';
      const result = input.replace(rules[1]!.pattern, rules[1]!.replacement as (match: string, ...args: string[]) => string);
      // The pattern should not match ${VAR} since it uses negative lookbehind for $
      expect(result).toBe('echo ${HOME}');
    });
  });

  describe('Rule 3: export translation', () => {
    it('translates export X=y to $env:X=', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'export PATH=~/bin'.replace(rules[2]!.pattern, rules[2]!.replacement as (match: string, ...args: string[]) => string);
      expect(result).toBe("$env:PATH='~/bin'");
    });
  });

  describe('Rule 4: mkdir -p translation', () => {
    it('translates mkdir -p to mkdir -Force', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'mkdir -p test'.replace(rules[3]!.pattern, rules[3]!.replacement as string);
      expect(result).toBe('mkdir test -Force');
    });
  });

  describe('Rule 5: rm -rf translation', () => {
    it('translates rm -rf to Remove-Item -Recurse -Force -Path', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'rm -rf test'.replace(rules[4]!.pattern, rules[4]!.replacement as string);
      expect(result).toBe('Remove-Item -Recurse -Force -Path test');
    });
  });

  describe('Rule 6: cat translation', () => {
    it('translates cat to Get-Content', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'cat file.txt'.replace(rules[5]!.pattern, rules[5]!.replacement as string);
      expect(result).toBe('Get-Content file.txt');
    });
  });

  describe('Rule 7: ls translation', () => {
    it('translates ls to Get-ChildItem', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'ls'.replace(rules[6]!.pattern, rules[6]!.replacement as string);
      expect(result).toBe('Get-ChildItem');
    });

    it('translates ls with trailing spaces', () => {
      const rules = createRules({ shouldTranslate: true });
      const result = 'ls  '.replace(rules[6]!.pattern, rules[6]!.replacement as string);
      expect(result).toBe('Get-ChildItem');
    });
  });
});