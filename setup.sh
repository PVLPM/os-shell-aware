#!/bin/bash
# setup.sh - Plugin installation script for Unix/macOS/WSL

set -e

PLUGIN_DIR="${HOME}/.config/opencode/plugins/os-shell-aware"
PLUGIN_FILES=("detector.js" "rules.js" "translator.js" "reminders.js" "index.js" "package.json")

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
if [ -z "$NODE_VERSION" ]; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Extract major version number
MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18+ is required. Found version: $NODE_VERSION"
    exit 1
fi

echo "Installing os-shell-aware plugin..."
echo "  Node.js version: $NODE_VERSION (OK)"

# Create plugin directory
mkdir -p "${PLUGIN_DIR}"

# Copy plugin files
for file in "${PLUGIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "${PLUGIN_DIR}/"
        echo "  Copied: $file"
    else
        echo "  Warning: $file not found, skipping"
    fi
done

# Verify installation
MISSING=0
for file in "${PLUGIN_FILES[@]}"; do
    if [ ! -f "${PLUGIN_DIR}/$file" ]; then
        echo "  Error: $file was not copied correctly"
        MISSING=1
    fi
done

if [ "$MISSING" -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo "   Plugin location: ${PLUGIN_DIR}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart OpenCode to load the plugin"
    echo "  2. The plugin will automatically detect your OS and shell"
    echo "  3. On Windows/PowerShell, bash commands will be translated to PowerShell"
else
    echo ""
    echo "❌ Installation incomplete - some files are missing"
    exit 1
fi
