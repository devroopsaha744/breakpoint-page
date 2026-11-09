#!/bin/sh
# Starts the Breakpoint MCP server. The server is a release asset rather than part of the plugin, so the first
# start downloads it (about 5 MB) into ~/.breakpoint/mcp/<version>; later starts run it straight away.
set -eu

VERSION="0.1.0"
URL="https://github.com/devroopsaha744/breakpoint-page/releases/download/v${VERSION}/breakpoint-mcp.tar.gz"
DIR="${BREAKPOINT_HOME:-$HOME/.breakpoint}/mcp/${VERSION}"

log() { echo "[breakpoint-mcp] $*" >&2; }

if [ ! -f "$DIR/server.mjs" ]; then
  log "downloading Breakpoint MCP ${VERSION}"
  TMP="$DIR.partial.$$"
  rm -rf "$TMP" && mkdir -p "$TMP"
  if ! curl -fsSL "$URL" | tar -xz -C "$TMP"; then
    rm -rf "$TMP"
    log "download failed: $URL"
    exit 1
  fi
  rm -rf "$DIR" && mv "$TMP" "$DIR"
fi

NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
  log "Node.js 20 or later is required and was not found on PATH"
  exit 1
fi
MAJOR="$("$NODE" -p 'process.versions.node.split(".")[0]')"
if [ "$MAJOR" -lt 20 ]; then
  log "Node.js 20 or later is required (found $("$NODE" -v) at $NODE)"
  exit 1
fi

exec "$NODE" "$DIR/server.mjs"
