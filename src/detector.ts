// detector.ts - Environment detection (OS, shell, WSL)

// Bun.platform exists at runtime but TypeScript definitions are incomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPlatform = () => (Bun as any).platform;

/**
 * Detects the current environment (platform, shell, translation need).
 * Uses synchronous detection only - NO subprocess.
 */
export type Platform = 'windows' | 'windows-gitbash' | 'macos' | 'linux' | 'wsl' | 'unknown'
export type Shell = 'bash' | 'zsh' | 'powershell' | 'pwsh' | 'cmd'

export interface EnvInfo {
  platform: Platform
  shell: Shell
  shouldTranslate: boolean
}

export function detectEnvironment(): EnvInfo {
  const plat = getPlatform();

  // Windows: Check for Git Bash/MSYS2 first via SHELL env
  if (plat === 'win32') {
    const shellEnv = Bun.env.SHELL || '';
    if (shellEnv.includes('bash') || shellEnv.includes('sh')) {
      return { platform: 'windows-gitbash', shell: 'bash', shouldTranslate: false };
    }

    // Check PSModulePath for PowerShell
    const psModulePath = Bun.env.PSModulePath || '';
    if (psModulePath.includes('PowerShell')) {
      return { platform: 'windows', shell: 'powershell', shouldTranslate: true };
    }

    // Default Windows shell is cmd
    return { platform: 'windows', shell: 'cmd', shouldTranslate: false };
  }

  // macOS
  if (plat === 'darwin') {
    return { platform: 'macos', shell: 'zsh', shouldTranslate: false };
  }

  // Linux: Check WSL_DISTRO_NAME (WSL1+2) before WSL_INTEROP (WSL2 only)
  if (plat === 'linux') {
    if (Bun.env.WSL_DISTRO_NAME || Bun.env.WSL_INTEROP) {
      return { platform: 'wsl', shell: 'bash', shouldTranslate: false };
    }
    return { platform: 'linux', shell: 'bash', shouldTranslate: false };
  }

  // Fallback for unknown platforms
  return { platform: 'unknown', shell: 'bash', shouldTranslate: false };
}

// Legacy exports for backwards compatibility
export function detectOS(): Platform {
  return detectEnvironment().platform;
}

export function detectShell(): Shell {
  return detectEnvironment().shell;
}

export function isWSL(): boolean {
  return detectEnvironment().platform === 'wsl';
}

export default { detectEnvironment, detectOS, detectShell, isWSL };