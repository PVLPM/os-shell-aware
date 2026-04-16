import { describe, expect, test } from 'bun:test';
import { getReminder, shouldShowReminder } from '../src/reminders';

describe('reminders', () => {
  test('getReminder("windows") returns iOS build warning', () => {
    expect(getReminder('windows')).toBe('⚠️ Do not attempt iOS/macOS builds (requires Xcode on macOS)');
  });

  test('getReminder("linux") returns iOS build warning', () => {
    expect(getReminder('linux')).toBe('⚠️ Do not attempt iOS/macOS builds (requires Xcode on macOS)');
  });

  test('getReminder("wsl") returns iOS build warning', () => {
    expect(getReminder('wsl')).toBe('⚠️ Do not attempt iOS/macOS builds (requires Xcode on macOS)');
  });

  test('getReminder("macos") returns empty string', () => {
    expect(getReminder('macos')).toBe('');
  });

  test('getReminder("unknown") returns empty string', () => {
    expect(getReminder('unknown')).toBe('');
  });

  test('shouldShowReminder returns true for windows', () => {
    expect(shouldShowReminder('windows')).toBe(true);
  });

  test('shouldShowReminder returns true for linux', () => {
    expect(shouldShowReminder('linux')).toBe(true);
  });

  test('shouldShowReminder returns true for wsl', () => {
    expect(shouldShowReminder('wsl')).toBe(true);
  });

  test('shouldShowReminder returns false for macos', () => {
    expect(shouldShowReminder('macos')).toBe(false);
  });

  test('shouldShowReminder returns false for unknown', () => {
    expect(shouldShowReminder('unknown')).toBe(false);
  });
});