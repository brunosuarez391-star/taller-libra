#!/usr/bin/env bash
# Install OpenClaw globally and run a non-interactive onboard.
# Run on your local machine (NOT inside a sandbox/container) so the
# daemon and credentials persist.
#
# Usage:
#   ./scripts/install-openclaw.sh                 # uses Claude CLI auth (default)
#   AUTH=anthropic ANTHROPIC_API_KEY=sk-ant-... ./scripts/install-openclaw.sh
#   AUTH=skip ./scripts/install-openclaw.sh       # install only, configure later

set -euo pipefail

AUTH="${AUTH:-claude-cli}"

require_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js no está instalado. Instala Node 22.14+ o 24+ antes de continuar." >&2
    exit 1
  fi
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt 22 ]; then
    echo "Error: Node $major detectado. OpenClaw requiere Node 22.14+ (recomendado: 24)." >&2
    exit 1
  fi
}

install_global() {
  echo "==> Instalando openclaw globalmente..."
  npm install -g openclaw
}

onboard() {
  case "$AUTH" in
    claude-cli)
      echo "==> Onboarding con Claude CLI..."
      openclaw onboard \
        --auth-choice claude-cli \
        --install-daemon \
        --accept-risk \
        --non-interactive
      ;;
    anthropic)
      if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
        echo "Error: AUTH=anthropic requiere ANTHROPIC_API_KEY en el entorno." >&2
        exit 1
      fi
      echo "==> Onboarding con Anthropic API key..."
      openclaw onboard \
        --auth-choice anthropic-api-key \
        --anthropic-api-key "$ANTHROPIC_API_KEY" \
        --install-daemon \
        --accept-risk \
        --non-interactive
      ;;
    openai)
      if [ -z "${OPENAI_API_KEY:-}" ]; then
        echo "Error: AUTH=openai requiere OPENAI_API_KEY en el entorno." >&2
        exit 1
      fi
      echo "==> Onboarding con OpenAI API key..."
      openclaw onboard \
        --auth-choice openai-api-key \
        --openai-api-key "$OPENAI_API_KEY" \
        --install-daemon \
        --accept-risk \
        --non-interactive
      ;;
    skip)
      echo "==> Instalando daemon sin proveedor (configurar después con: openclaw configure)..."
      openclaw onboard \
        --auth-choice skip \
        --install-daemon \
        --accept-risk \
        --non-interactive
      ;;
    *)
      echo "Error: AUTH desconocido: $AUTH (válidos: claude-cli, anthropic, openai, skip)" >&2
      exit 1
      ;;
  esac
}

main() {
  require_node
  install_global
  onboard
  echo
  echo "✔ OpenClaw instalado. Comandos útiles:"
  echo "    openclaw configure       # canales (Telegram/Discord/Slack), gateway, etc."
  echo "    openclaw chat            # TUI local"
  echo "    openclaw gateway status  # ver estado del daemon"
}

main "$@"
