import { describe, it, expect, beforeAll } from 'bun:test';
import { detectEnvironment, detectOS, detectShell, isWSL, type Platform, type Shell, type EnvInfo } from '../src/detector';

// Bun.platform exists at runtime but TypeScript definitions are incomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPlatform = () => (Bun as any).platform;

// Save original values
const originalPlatform = getPlatform();
const originalEnv = { ...Bun.env };

// Helper to set up environment
function setEnvironment(env: Record<string, string | undefined>): void {
  // Bun.platform is read-only at runtime, so we test by verifying behavior
  // For full isolation, we test via the actual Bun.env which we can modify
  Object.keys(env).forEach(key => {
    if (env[key] === undefined) {
      delete Bun.env[key];
    } else {
      Bun.env[key] = env[key] as string;
    }
  });
}

describe('detectEnvironment', () => {
  describe('Windows PowerShell', () => {
    it('detects windows with powershell when PSModulePath includes PowerShell', () => {
      // Set up Windows environment with PowerShell
      Bun.env.SHELL = undefined;
      Bun.env.PSModulePath = 'C:\\Program Files\\PowerShell\\Modules';
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('windows');
      expect(result.shell).toBe('powershell');
      expect(result.shouldTranslate).toBe(true);
    });
  });

  describe('Windows cmd', () => {
    it('detects windows with cmd when no PSModulePath', () => {
      Bun.env.SHELL = undefined;
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('windows');
      expect(result.shell).toBe('cmd');
      expect(result.shouldTranslate).toBe(false);
    });
  });

  describe('Windows Git Bash', () => {
    it('detects windows-gitbash when SHELL includes bash', () => {
      Bun.env.SHELL = '/usr/bin/bash';
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('windows-gitbash');
      expect(result.shell).toBe('bash');
      expect(result.shouldTranslate).toBe(false);
    });

    it('detects windows-gitbash when SHELL includes sh', () => {
      Bun.env.SHELL = '/bin/sh';
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('windows-gitbash');
      expect(result.shell).toBe('bash');
      expect(result.shouldTranslate).toBe(false);
    });
  });

  describe('macOS', () => {
    it('detects macos with zsh shell', () => {
      Bun.env.SHELL = '/bin/zsh';
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('macos');
      expect(result.shell).toBe('zsh');
      expect(result.shouldTranslate).toBe(false);
    });
  });

  describe('Linux', () => {
    it('detects linux with bash shell', () => {
      Bun.env.SHELL = '/bin/bash';
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('linux');
      expect(result.shell).toBe('bash');
      expect(result.shouldTranslate).toBe(false);
    });
  });

  describe('WSL via WSL_DISTRO_NAME', () => {
    it('detects wsl when WSL_DISTRO_NAME is set (WSL1 or WSL2)', () => {
      Bun.env.SHELL = '/bin/bash';
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = 'Ubuntu';
      Bun.env.WSL_INTEROP = undefined;

      const result = detectEnvironment();
      expect(result.platform).toBe('wsl');
      expect(result.shell).toBe('bash');
      expect(result.shouldTranslate).toBe(false);
    });
  });

  describe('WSL via WSL_INTEROP', () => {
    it('detects wsl when WSL_INTEROP is set (WSL2 only)', () => {
      Bun.env.SHELL = '/bin/bash';
      Bun.env.PSModulePath = undefined;
      Bun.env.WSL_DISTRO_NAME = undefined;
      Bun.env.WSL_INTEROP = '/mnt/c/Users';

      const result = detectEnvironment();
      expect(result.platform).toBe('wsl');
      expect(result.shell).toBe('bash');
      expect(result.shouldTranslate).toBe(false);
    });
  });
});

describe('detectOS', () => {
  it('returns the platform type', () => {
    Bun.env.SHELL = undefined;
    Bun.env.PSModulePath = undefined;
    Bun.env.WSL_DISTRO_NAME = undefined;
    Bun.env.WSL_INTEROP = undefined;

    const os = detectOS();
    expect(typeof os).toBe('string');
    expect(['windows', 'windows-gitbash', 'macos', 'linux', 'wsl', 'unknown']).toContain(os);
  });
});

describe('detectShell', () => {
  it('returns the shell type', () => {
    Bun.env.SHELL = '/bin/bash';
    Bun.env.PSModulePath = undefined;
    Bun.env.WSL_DISTRO_NAME = undefined;
    Bun.env.WSL_INTEROP = undefined;

    const shell = detectShell();
    expect(typeof shell).toBe('string');
    expect(['bash', 'zsh', 'powershell', 'pwsh', 'cmd']).toContain(shell);
  });
});

describe('isWSL', () => {
  it('returns true when platform is wsl', () => {
    Bun.env.SHELL = '/bin/bash';
    Bun.env.PSModulePath = undefined;
    Bun.env.WSL_DISTRO_NAME = 'Ubuntu';
    Bun.env.WSL_INTEROP = undefined;

    expect(isWSL()).toBe(true);
  });

  it('returns false when platform is not wsl', () => {
    Bun.env.SHELL = '/bin/bash';
    Bun.env.PSModulePath = undefined;
    Bun.env.WSL_DISTRO_NAME = undefined;
    Bun.env.WSL_INTEROP = undefined;

    expect(isWSL()).toBe(false);
  });
});