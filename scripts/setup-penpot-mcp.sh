#!/usr/bin/env bash
# Setup Penpot MCP server for local development
# Run this once from the project root: bash scripts/setup-penpot-mcp.sh

set -euo pipefail

PENPOT_MCP_DIR="${HOME}/.penpot-mcp"

echo "=== Penpot MCP Server Setup ==="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 22 ]; then
  echo "Error: Node.js 22+ required. Current: $(node -v 2>/dev/null || echo 'not installed')"
  exit 1
fi
echo "Node.js $(node -v) detected"

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi
echo "pnpm $(pnpm -v) detected"

# Clone or update Penpot MCP
if [ -d "$PENPOT_MCP_DIR" ]; then
  echo "Updating existing Penpot MCP installation..."
  cd "$PENPOT_MCP_DIR"
  git pull origin mcp-prod
else
  echo "Cloning Penpot MCP server (production branch)..."
  git clone https://github.com/penpot/penpot.git --branch mcp-prod --depth 1 "$PENPOT_MCP_DIR"
fi

# Build
cd "$PENPOT_MCP_DIR/mcp"
echo "Running setup..."
./scripts/setup
echo "Building and starting MCP server..."
pnpm run bootstrap

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Open Penpot at https://design.penpot.app"
echo "  2. Open a design file"
echo "  3. Go to Plugins menu"
echo "  4. Load plugin from: http://localhost:4400/manifest.json"
echo "  5. Click 'Connect to MCP server' in the plugin panel"
echo "  6. Keep the plugin panel open while working"
echo ""
echo "Claude Code is already configured to connect at http://localhost:4401/mcp"
echo "To verify: claude mcp list"
