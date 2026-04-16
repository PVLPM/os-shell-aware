# os-shell-aware

OpenCode plugin for OS-aware shell command translation and build constraint reminders.

## What It Does

1. **Detects your environment**: Windows/PowerShell, macOS, Linux, or WSL
2. **Translates commands**: Bash syntax → PowerShell syntax on Windows
3. **Reminds about constraints**: Warns before attempting impossible builds (iOS on Windows)

## Quick Start

```bash
# Install globally
mkdir -p ~/.config/opencode/plugins/
git clone https://github.com/YOUR_USER/os-shell-aware ~/.config/opencode/plugins/os-shell-aware
```

## Usage

Once installed, the plugin:
- Automatically detects your OS and shell
- Translates bash commands to PowerShell on Windows
- Injects build reminders at session start

## Requirements

- OpenCode
- Bun runtime

## Architecture

```
os-shell-aware/
├── index.ts          # Entry point, registers hooks
├── detector.ts       # Environment detection
├── translator.ts     # Command translation
├── rules.ts          # Translation rules
├── reminders.ts      # Build constraint messages
└── package.json
```

## License

MIT
