# OpenClaw

[OpenClaw](https://openclaw.ai/) es un asistente de IA personal y self-hosted: corre como un *gateway* en tu máquina y se conecta a apps de chat (Telegram, Discord, Slack, WhatsApp, iMessage…). Una vez instalado de forma global, queda disponible para **todos tus proyectos**, no solo para `libra-flota`.

## Requisitos

- Node.js **22.14+** (recomendado 24)
- npm o pnpm
- Correr en tu máquina local — no funciona en sandboxes/contenedores efímeros (el daemon no persiste).

## Instalación rápida

Desde la raíz de este repo:

```bash
npm run setup:openclaw
```

El script (`scripts/install-openclaw.sh`) hace dos cosas:

1. `npm install -g openclaw`
2. `openclaw onboard --auth-choice claude-cli --install-daemon --accept-risk --non-interactive`

Por defecto reusa tu **Claude CLI** ya autenticado. Si prefieres otro proveedor:

```bash
# Anthropic API key
AUTH=anthropic ANTHROPIC_API_KEY=sk-ant-... npm run setup:openclaw

# OpenAI API key
AUTH=openai OPENAI_API_KEY=sk-... npm run setup:openclaw

# Solo instalar el daemon, configurar el proveedor después manualmente
AUTH=skip npm run setup:openclaw
```

## Después del setup

```bash
openclaw configure       # canales (Telegram/Discord/Slack), gateway, agentes
openclaw chat            # abre la TUI local para probar
openclaw gateway status  # estado del daemon
openclaw --help          # ver todos los comandos
```

Documentación oficial: https://docs.openclaw.ai/

## Notas

- `--accept-risk` es obligatorio para `--non-interactive`: reconoce que un agente con acceso al sistema es potente y conlleva riesgo.
- El daemon se instala como servicio del sistema (systemd en Linux, launchd en macOS, Service en Windows). Para desinstalarlo: `openclaw daemon uninstall`.
