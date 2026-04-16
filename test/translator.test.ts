import { describe, expect, test } from 'bun:test';
import { translate } from '../src/translator';
import { createRules } from '../src/rules';

describe('translate', () => {
  test('passes through null/undefined unchanged', () => {
    expect(translate(null as any, []) as any).toBeNull();
    expect(translate(undefined as any, []) as any).toBeUndefined();
  });

  test('passes through empty string unchanged', () => {
    expect(translate('', [])).toBe('');
  });

  test('passes through non-string unchanged', () => {
    expect(translate(123 as any, []) as any).toBe(123);
    expect(translate({} as any, []) as any).toEqual({});
  });

  test('passes through PowerShell commands unchanged', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('Get-Process', rules)).toBe('Get-Process');
    expect(translate('Set-ExecutionPolicy', rules)).toBe('Set-ExecutionPolicy');
    expect(translate('Invoke-WebRequest https://example.com', rules)).toBe('Invoke-WebRequest https://example.com');
  });

  test('applies && rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('mkdir test && echo hi', rules)).toBe('mkdir test; if ($?) { echo hi }');
  });

  test('applies $VAR rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('echo $HOME', rules)).toBe('echo $env:HOME');
    expect(translate('echo $PATH', rules)).toBe('echo $env:PATH');
  });

  test('applies export rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('export MY_VAR=hello', rules)).toBe("$env:MY_VAR='hello'");
  });

  test('applies mkdir -p rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('mkdir -p mydir', rules)).toBe('mkdir mydir -Force');
  });

  test('applies rm -rf rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('rm -rf mydir', rules)).toBe('Remove-Item -Recurse -Force -Path mydir');
  });

  test('applies cat rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('cat myfile.txt', rules)).toBe('Get-Content myfile.txt');
  });

  test('applies ls rule correctly', () => {
    const rules = createRules({ shouldTranslate: true });
    expect(translate('ls', rules)).toBe('Get-ChildItem');
  });

  test('returns original command on error', () => {
    // Create a rule with a replacement getter that throws
    let throwCount = 0;
    const badRules = [{
      pattern: /test/,
      get replacement() {
        throwCount++;
        throw new Error('synthetic error');
      }
    }];
    const original = 'echo test';
    expect(translate(original, badRules as any)).toBe(original);
    expect(throwCount).toBeGreaterThan(0);
  });

  test('returns original when no rules provided', () => {
    expect(translate('mkdir test && echo hi', [])).toBe('mkdir test && echo hi');
  });

  test('handles multiple rules in sequence', () => {
    const rules = createRules({ shouldTranslate: true });
    // This has both && and $VAR
    expect(translate('echo $HOME && echo $PATH', rules)).toBe('echo $env:HOME; if ($?) { echo $env:PATH }');
  });
});