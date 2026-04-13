# Libra Fleet — Claude Managed Agent

Agente de desarrollo asistido por IA para el proyecto Libra Fleet.
Usa [Claude Managed Agents](https://docs.anthropic.com/en/docs/agents-and-tools/managed-agents) para ejecutar tareas de desarrollo en un entorno sandbox con acceso al repositorio.

## Qué puede hacer

- Leer, editar y crear archivos del proyecto
- Ejecutar comandos bash (`npm run build`, `git`, etc.)
- Buscar en el código y en la web
- Entender el stack completo: React, Supabase, Tailwind, Vite
- Trabajar con el esquema SQL y la API de Supabase
- Crear branches, commits y push al repo

## Requisitos

- Node.js 18+
- API key de Anthropic ([console.anthropic.com](https://console.anthropic.com))
- GitHub Personal Access Token (para montar el repo)

## Setup

### 1. Instalar dependencias

```bash
cd managed-agent
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y agregar:
- `ANTHROPIC_API_KEY` — tu API key de Anthropic
- `GITHUB_TOKEN` — tu PAT de GitHub (scopes: Contents Read/Write)

### 3. Crear el agente (una sola vez)

```bash
npm run setup
```

Esto crea el agente y el entorno en Anthropic. Copiar los IDs que imprime al `.env`:

```
AGENT_ID=agent_...
AGENT_VERSION=...
ENVIRONMENT_ID=env_...
```

## Uso

### Chat interactivo

```bash
npm start
```

Abre una sesión interactiva donde podés chatear con el agente. Escribí `salir` para terminar.

### Comando directo (fire-and-forget)

```bash
npm start -- "Agregá un campo email al formulario de Nueva OT"
```

Ejecuta la instrucción y termina.

### Ejemplos de uso

```bash
# Agregar una feature
npm start -- "Agregá filtro por fecha en la página de Ordenes"

# Fix un bug
npm start -- "El botón Cambiar Estado no actualiza el badge en la tabla de Ordenes"

# Refactoring
npm start -- "Extraé los estilos de badge de status a un componente reutilizable"

# Análisis
npm start -- "Analizá el esquema SQL y sugerí índices para mejorar performance"
```

## Arquitectura

```
setup.js  ─── agents.create() + environments.create()
               │
               │  (IDs guardados en .env)
               ▼
run.js    ─── sessions.create(agent, environment)
               │
               ├── events.send(user.message)
               ├── events.stream() ← agent.message, agent.tool_use, etc.
               └── sessions.archive()
```

El agente corre en un container sandbox de Anthropic con:
- Bash, lectura/escritura de archivos, glob, grep
- Web search y web fetch
- El repo montado en `/workspace/taller-libra`
