# 🧠 Libra Fleet — Agente Administrado de Claude

Configuración de un **Managed Agent** de Anthropic que da asistencia de desarrollo con IA para el proyecto Libra Fleet. El agente corre en un entorno aislado de Anthropic con acceso completo al repositorio de GitHub y toolset de desarrollo.

---

## ✨ Capacidades

El agente tiene acceso a:

- **Filesystem del repo** — `/workspace/taller-libra` montado automáticamente en cada sesión
- **Toolset completo** — `bash`, `read`, `write`, `edit`, `glob`, `grep`, `web_fetch`, `web_search`
- **Habilidad PDF** — leer cotizaciones, facturas, remitos
- **Red sin restricciones** — acceso a npm, GitHub, documentación pública
- **System prompt integral** — conoce la paleta, el stack, las reglas de negocio, los eventos del bus n8n y las convenciones de commits

### Casos de uso típicos

| Caso | Ejemplo |
|---|---|
| Desarrollo de features | `"Agregá un campo 'notas' a los clientes y mostralo en la ficha"` |
| Debugging | `"Revisá por qué falla el build en CI y arreglalo"` |
| Refactors | `"Migrá el estado de inventario de localStorage a Supabase"` |
| Lectura de PDFs | `"Leé la cotización Jones 2026 y actualizá los precios en data.js"` |
| Documentación | `"Generá un diagrama Mermaid del flujo de eventos del bus n8n"` |
| Investigación | `"¿Cómo implemento RLS de Supabase por cliente_id?"` |

---

## 🚀 Setup (3 pasos)

### 1 · Instalar dependencias

```bash
cd agent-admin
npm install
```

### 2 · Configurar variables

```bash
cp .env.example .env
```

Editá `.env` y cargá:

- **`ANTHROPIC_API_KEY`** — de [console.anthropic.com](https://console.anthropic.com/) → API Keys
- **`GITHUB_TOKEN`** — Personal Access Token con permisos `Contents: Read and write` sobre el repo `brunosuarez391-star/taller-libra`. Generá uno en [github.com/settings/tokens](https://github.com/settings/tokens?type=beta)

### 3 · Crear agent + environment (una sola vez)

```bash
npm run setup
```

El script crea el Environment y el Agent en tu cuenta de Anthropic, y guarda los IDs en `.env` automáticamente. Output esperado:

```
🔨 Creando Environment cloud...
✅ Environment creado: env_abc123...
🧠 Creando Agent con system prompt de Libra Fleet...
✅ Agent creado: agent_xyz789... (version 1)

✅ Setup completo. IDs guardados en .env.
```

**Esto se corre UNA sola vez.** Re-ejecutar no duplica nada (detecta los IDs en `.env`).

---

## 💬 Uso

### Chat interactivo

```bash
npm start
```

Abre un bucle de turnos. Escribí tu mensaje → Enter → el agente piensa, ejecuta tools, y responde streamado en vivo.

Comandos dentro del chat:

| Comando | Efecto |
|---|---|
| `/exit` o `/quit` | Salir y archivar la sesión |
| `/reset` | Archivar la sesión actual y arrancar una nueva (útil si el contexto se llenó) |
| `Ctrl+C` | Interrupt + salir limpio |

### Ejecución one-shot

```bash
npm start -- "agregá un campo patente a la tabla de vehículos"
```

El agente ejecuta la instrucción, termina, y archiva la sesión automáticamente. Ideal para automatización desde scripts o CI.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Tu máquina                            │
│                                                              │
│  ┌──────────┐           ┌───────────┐                        │
│  │ setup.js │           │  run.js   │                        │
│  │ (1 vez)  │           │ (cada run)│                        │
│  └────┬─────┘           └─────┬─────┘                        │
│       │                       │                              │
│       │ agents.create()       │ sessions.create()            │
│       │ environments.create() │ events.stream()              │
│       │                       │ events.send()                │
└───────┼───────────────────────┼──────────────────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Anthropic Managed Agents API                  │
│                                                              │
│  Agent (persistido) ──────▶ Orchestration Layer             │
│    - model: opus-4-6        (corre el loop del agente)      │
│    - system prompt                                           │
│    - tools                                                   │
│                                    │                         │
│                                    ▼ tool calls              │
│                            ┌────────────────────┐            │
│                            │ Session Container  │            │
│                            │ (sandbox aislado)  │            │
│                            │                    │            │
│                            │  /workspace/       │            │
│                            │  └─ taller-libra/  │◄── GitHub  │
│                            │       (mounted)    │            │
│                            └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Puntos clave:**

- **Agent = persistente, versionado.** Se crea una vez con `setup.js`. Su ID queda en `.env`. Si querés cambiar el system prompt o los tools, hacés un `update` sobre el mismo agent_id (crea una nueva versión inmutable automáticamente, sin romper sesiones en curso).
- **Session = efímera, por invocación.** Cada `npm start` crea una sesión nueva que referencia el agent_id + environment_id, monta el repo desde GitHub, y streamea eventos hacia tu terminal.
- **El repo se monta fresh cada vez.** Cambios que commitee el agente van al repo remoto. Si no hay commit, se pierden al archivar la sesión.

---

## 📁 Archivos

```
agent-admin/
├── setup.js          # Crea environment + agent one-time
├── run.js            # Runtime: interactivo o one-shot
├── .env.example      # Template de configuración
├── .env              # Config local (NO commitear)
├── package.json      # Dependencias y scripts
└── README.md         # Este archivo
```

---

## 🔧 Gestión del agente

### Ver el agente creado

```bash
node -e "import('dotenv/config').then(() => import('@anthropic-ai/sdk').then(({default: A}) => new A().beta.agents.retrieve(process.env.ANTHROPIC_AGENT_ID).then(a => console.log(JSON.stringify(a, null, 2)))))"
```

### Actualizar el system prompt

Editá el string `SYSTEM_PROMPT` en `setup.js` y creá un script pequeño que llame a `agents.update()`:

```js
await client.beta.agents.update(process.env.ANTHROPIC_AGENT_ID, {
  system: NUEVO_SYSTEM_PROMPT,
})
```

Cada update crea una **versión inmutable**. Sesiones en curso mantienen su versión; sesiones nuevas usan la última.

### Ver sesiones recientes

```bash
node -e "import('dotenv/config').then(() => import('@anthropic-ai/sdk').then(({default: A}) => new A().beta.sessions.list({limit: 10}).then(r => console.log(r.data.map(s => ({id: s.id, title: s.title, status: s.status, created: s.created_at}))))))"
```

---

## ⚠️ Seguridad

- **Nunca commitees `.env`** — contiene tu API key de Anthropic y tu token de GitHub.
- El `GITHUB_TOKEN` se transfiere al cloud de Anthropic al crear cada sesión. Anthropic lo usa solo para `git clone`/`pull`/`push` vía su proxy — no se expone dentro del sandbox (el código que escriba el agente no puede leerlo).
- El agente puede editar y commitear archivos. Revisá los commits antes de pushear a `main`.
- Si perdés el control de una sesión corriendo: `Ctrl+C` manda `user.interrupt` y archiva limpio.

---

## 🆘 Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| `Falta ANTHROPIC_API_KEY en .env` | No copiaste `.env.example` a `.env` | `cp .env.example .env` y cargá los valores |
| `GITHUB_TOKEN no configurado` | Falta el PAT en `.env` | Generá uno en github.com/settings/tokens y pegalo |
| Timeout al clonar el repo | PAT sin permisos o repo privado | Verificar que el PAT tenga `Contents: Read and write` sobre `taller-libra` |
| `401 authentication_error` | API key inválida o expirada | Generá una nueva en console.anthropic.com |
| `403 Host not in allowlist` al usar `bash` | Environment con networking restringido | Recrear el environment con `networking: { type: "unrestricted" }` |
| El agente no ve un archivo nuevo | El archivo no está commiteado en `main` | Committear y pushear antes de arrancar la sesión |

---

## 📚 Referencias

- [Managed Agents — Anthropic Docs](https://platform.claude.com/docs/en/managed-agents/overview)
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)
- [Skill catalog para claude-api](https://platform.claude.com/docs/en/agents-and-tools/skills)
