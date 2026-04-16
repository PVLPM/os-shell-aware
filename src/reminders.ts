const REMINDERS: Record<string, string> = {
  windows: '⚠️ Do not attempt iOS/macOS builds (requires Xcode on macOS)',
  linux: '⚠️ Do not attempt iOS/macOS builds (requires Xcode on macOS)',
  wsl: '⚠️ Do not attempt iOS/macOS builds (requires Xcode on macOS)',
  macos: '',
  unknown: ''
}

export function shouldShowReminder(platform: string): boolean {
  return platform === 'windows' || platform === 'linux' || platform === 'wsl';
}

export function getReminder(platform: string): string {
  return REMINDERS[platform] ?? REMINDERS['unknown'] ?? '';
}