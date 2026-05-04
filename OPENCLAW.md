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

## Botón en la app Electron

La cabecera de Libra Flota incluye un botón **🦞 OpenClaw** que abre `openclaw chat` en una terminal del sistema (Terminal.app en macOS, `gnome-terminal`/`konsole`/`xterm` en Linux, `cmd` en Windows). Si OpenClaw no está instalado el botón muestra un aviso con las instrucciones de setup.

## Workflow de n8n

Hay un workflow de n8n (`Libra Flota — Ask OpenClaw`) que expone un webhook como puente al gateway local de OpenClaw:

```
POST https://<tu-n8n>/webhook/openclaw-ask
Content-Type: application/json

{ "prompt": "¿Cuántos camiones están en mantenimiento?" }
```

El workflow apunta a `http://localhost:19000/v1/agent/run` (placeholder). Verifica el endpoint real con `openclaw gateway info` y ajusta la URL si difiere. Requiere que n8n corra en la misma máquina que el daemon de OpenClaw.

## Notas

- `--accept-risk` es obligatorio para `--non-interactive`: reconoce que un agente con acceso al sistema es potente y conlleva riesgo.
- El daemon se instala como servicio del sistema (systemd en Linux, launchd en macOS, Service en Windows). Para desinstalarlo: `openclaw daemon uninstall`.
