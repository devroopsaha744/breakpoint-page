#!/bin/sh
# Installs Breakpoint for Claude Code without the plugin system: the MCP server into ~/.breakpoint/mcp, the /qa
# skill into ~/.claude/skills, and registers the server with `claude mcp add` at user scope.
#   curl -fsSL https://devroopsaha744.github.io/breakpoint-page/install.sh | sh
set -eu

VERSION="0.1.0"
REPO="devroopsaha744/breakpoint-page"
DIR="${BREAKPOINT_HOME:-$HOME/.breakpoint}/mcp/${VERSION}"
SKILL_DIR="$HOME/.claude/skills/qa"

say() { printf '\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

NODE="$(command -v node || true)"
[ -n "$NODE" ] || fail "Node.js 20 or later is required: https://nodejs.org"
MAJOR="$("$NODE" -p 'process.versions.node.split(".")[0]')"
[ "$MAJOR" -ge 20 ] || fail "Node.js 20 or later is required (found $("$NODE" -v))"
command -v docker >/dev/null 2>&1 || say "Note: Docker was not found. Install OrbStack or Docker Desktop before your first session."

say "Downloading the Breakpoint MCP server ${VERSION}"
TMP="$DIR.partial.$$"
rm -rf "$TMP" && mkdir -p "$TMP"
curl -fsSL "https://github.com/${REPO}/releases/download/v${VERSION}/breakpoint-mcp.tar.gz" | tar -xz -C "$TMP" || { rm -rf "$TMP"; fail "download failed"; }
rm -rf "$DIR" && mv "$TMP" "$DIR"

say "Installing the /qa skill"
mkdir -p "$SKILL_DIR"
curl -fsSL "https://raw.githubusercontent.com/${REPO}/main/plugin/skills/qa/SKILL.md" -o "$SKILL_DIR/SKILL.md" || fail "skill download failed"

if command -v claude >/dev/null 2>&1; then
  say "Registering the MCP server with Claude Code"
  claude mcp remove breakpoint -s user >/dev/null 2>&1 || true
  claude mcp add breakpoint -s user -- "$NODE" "$DIR/server.mjs"
else
  say "Claude Code was not found. Register the server yourself:"
  echo "  claude mcp add breakpoint -s user -- \"$NODE\" \"$DIR/server.mjs\""
fi

say "Done. Start a new Claude Code session and ask it to QA your app."
