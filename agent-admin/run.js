#!/usr/bin/env node
// run.js — Runtime del agente administrado Libra Fleet
//
// Modos:
//   npm start                      → chat interactivo (loop de turnos)
//   npm start -- "instrucción"     → ejecución one-shot, archiva la sesión al terminar
//
// El agente y el environment se referencian por ID desde .env (creados por setup.js).
// Cada invocación crea una NUEVA session que monta el repo taller-libra en /workspace.

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const GITHUB_REPO_URL = 'https://github.com/brunosuarez391-star/taller-libra'
const MOUNT_PATH = '/workspace/taller-libra'
const DEFAULT_BRANCH = 'main'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`❌ Falta ${name} en .env — corré \`npm run setup\` primero.`)
    process.exit(1)
  }
  return v
}

// Handlers de eventos — priorizan mensajes del agente > razonamiento > uso de herramientas.
// Cada handler es sincrónico y se llama con el evento parseado de la SSE.
const handlers = {
  'agent.message': (event) => {
    for (const block of event.content || []) {
      if (block.type === 'text' && block.text) {
        process.stdout.write(block.text)
      }
    }
  },
  'agent.thinking': (event) => {
    // Razonamiento — mostrar si display=summarized. Default omitido (Opus 4.7).
    for (const block of event.content || []) {
      if (block.type === 'thinking' && block.thinking) {
        process.stdout.write(`\n\x1b[2m[razonamiento] ${block.thinking}\x1b[0m`)
      }
    }
  },
  'agent.tool_use': (event) => {
    const name = event.name || event.tool_name || 'tool'
    process.stdout.write(`\n\x1b[36m🔧 ${name}\x1b[0m`)
    if (event.input && Object.keys(event.input).length < 8) {
      const summary = summarizeToolInput(event.input)
      if (summary) process.stdout.write(` \x1b[2m${summary}\x1b[0m`)
    }
  },
  'agent.tool_result': (event) => {
    if (event.is_error) {
      process.stdout.write(` \x1b[31m✗\x1b[0m`)
    } else {
      process.stdout.write(` \x1b[32m✓\x1b[0m`)
    }
  },
  'agent.mcp_tool_use': (event) => {
    process.stdout.write(`\n\x1b[35m🌐 mcp:${event.name || event.tool_name}\x1b[0m`)
  },
  'agent.mcp_tool_result': (event) => {
    process.stdout.write(event.is_error ? ` \x1b[31m✗\x1b[0m` : ` \x1b[32m✓\x1b[0m`)
  },
  'agent.custom_tool_use': (event) => {
    process.stdout.write(`\n\x1b[33m⚠️  custom_tool:${event.name || event.tool_name} — requiere custom_tool_result\x1b[0m`)
  },
  'agent.thread_context_compacted': () => {
    process.stdout.write('\n\x1b[2m[contexto compactado]\x1b[0m')
  },
  'session.error': (event) => {
    console.error('\n\x1b[31m❌ session.error:\x1b[0m', event.message || event.error || event)
  },
  'span.model_request_end': (event) => {
    const u = event.model_usage
    if (u) {
      const total = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0)
      if (total > 0) {
        process.stderr.write(`\n\x1b[2m[tokens: in=${u.input_tokens || 0} out=${u.output_tokens || 0} cache_r=${u.cache_read_input_tokens || 0}]\x1b[0m`)
      }
    }
  },
}

function summarizeToolInput(input) {
  // Resumen corto y útil para mostrar mientras corre la herramienta.
  if (typeof input !== 'object' || !input) return ''
  if (input.command) return truncate(input.command, 80)
  if (input.file_path) return input.file_path
  if (input.pattern) return `"${truncate(input.pattern, 40)}"`
  if (input.url) return input.url
  if (input.query) return `"${truncate(input.query, 40)}"`
  return ''
}

function truncate(s, n) {
  s = String(s)
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function handleEvent(event) {
  const fn = handlers[event.type]
  if (fn) fn(event)
}

// Consumir el stream hasta que la sesión esté idle con stop_reason terminal,
// o hasta que esté terminated. El caller decide qué hacer después (bucle chat o archive).
async function consumeUntilIdleOrTerminated(stream) {
  for await (const event of stream) {
    handleEvent(event)

    if (event.type === 'session.status_terminated') {
      return { status: 'terminated', reason: event.reason || null }
    }

    if (event.type === 'session.status_idle') {
      const stopType = event.stop_reason?.type
      if (stopType === 'requires_action') {
        // Espera input del cliente (tool_confirmation / custom_tool_result).
        // En este agente no tenemos custom tools ni always_ask — no debería pasar.
        // Si pasara, lo ignoramos y seguimos consumiendo el stream.
        continue
      }
      return { status: 'idle', stop_reason: stopType || 'end_turn' }
    }
  }
  return { status: 'stream_closed' }
}

// Pattern 6: evitar race de archive mientras el status server-side todavía dice "running".
async function waitForSettled(client, sessionId) {
  for (let i = 0; i < 10; i++) {
    const s = await client.beta.sessions.retrieve(sessionId)
    if (s.status !== 'running') return s
    await new Promise(r => setTimeout(r, 200))
  }
  return null
}

async function sendMessageAndStream(client, session, text) {
  // Pattern 7: stream-first, then send — abrir el stream ANTES de mandar el mensaje
  // garantiza que no perdamos los primeros eventos.
  const streamPromise = client.beta.sessions.events.stream(session.id)

  const [stream] = await Promise.all([
    streamPromise,
    client.beta.sessions.events.send(session.id, {
      events: [{ type: 'user.message', content: [{ type: 'text', text }] }],
    }),
  ])

  const result = await consumeUntilIdleOrTerminated(stream)
  process.stdout.write('\n')
  return result
}

async function createSession(client) {
  const agentId = requireEnv('ANTHROPIC_AGENT_ID')
  const environmentId = requireEnv('ANTHROPIC_ENVIRONMENT_ID')
  const githubToken = process.env.GITHUB_TOKEN

  const resources = []
  if (githubToken) {
    resources.push({
      type: 'github_repository',
      url: GITHUB_REPO_URL,
      authorization_token: githubToken,
      mount_path: MOUNT_PATH,
      checkout: { type: 'branch', name: DEFAULT_BRANCH },
    })
  } else {
    console.warn('⚠️  GITHUB_TOKEN no configurado — el agente no tendrá el repo montado.')
    console.warn('   Agregá GITHUB_TOKEN=ghp_... en .env para clonar taller-libra en /workspace.')
  }

  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: environmentId,
    title: `libra-fleet — ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`,
    resources,
  })

  return session
}

async function archiveSession(client, sessionId) {
  try {
    await waitForSettled(client, sessionId)
    await client.beta.sessions.archive(sessionId)
  } catch (err) {
    // No critical — log and continue
    console.warn(`⚠️  No se pudo archivar la sesión ${sessionId}: ${err?.message || err}`)
  }
}

async function runOneShot(client, instruction) {
  console.log(`\n🧠 Libra Fleet Agent — modo one-shot`)
  console.log(`📝 Instrucción: ${instruction}\n`)

  const session = await createSession(client)
  console.log(`🆔 Session: ${session.id}\n`)

  let signalHandled = false
  const onInterrupt = async () => {
    if (signalHandled) return
    signalHandled = true
    console.log('\n\n⏹  Interrupción recibida — enviando interrupt y archivando...')
    try {
      await client.beta.sessions.events.send(session.id, {
        events: [{ type: 'user.interrupt' }],
      })
    } catch {}
    await archiveSession(client, session.id)
    process.exit(130)
  }
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onInterrupt)

  try {
    await sendMessageAndStream(client, session, instruction)
  } finally {
    await archiveSession(client, session.id)
  }
}

async function runInteractive(client) {
  console.log('\n🧠 Libra Fleet Agent — chat interactivo')
  console.log('   Escribí tu mensaje y Enter. Comandos: /exit para salir, /reset para nueva sesión.\n')

  const rl = readline.createInterface({ input, output })

  let session = await createSession(client)
  console.log(`🆔 Session: ${session.id}\n`)

  let signalHandled = false
  const onInterrupt = async () => {
    if (signalHandled) return
    signalHandled = true
    console.log('\n\n⏹  Saliendo...')
    rl.close()
    await archiveSession(client, session.id)
    process.exit(0)
  }
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onInterrupt)

  try {
    while (true) {
      const text = (await rl.question('\n\x1b[1m> \x1b[0m')).trim()
      if (!text) continue

      if (text === '/exit' || text === '/quit') break
      if (text === '/reset') {
        console.log('🔄 Archivando sesión actual y creando una nueva...')
        await archiveSession(client, session.id)
        session = await createSession(client)
        console.log(`🆔 Session: ${session.id}`)
        continue
      }

      const result = await sendMessageAndStream(client, session, text)
      if (result.status === 'terminated') {
        console.log('\n⚠️  Sesión terminada por el servidor. Creando una nueva...')
        session = await createSession(client)
        console.log(`🆔 Session: ${session.id}`)
      }
    }
  } finally {
    rl.close()
    await archiveSession(client, session.id)
  }
}

async function main() {
  requireEnv('ANTHROPIC_API_KEY')
  const client = new Anthropic()

  const args = process.argv.slice(2)
  const instruction = args.join(' ').trim()

  if (instruction) {
    await runOneShot(client, instruction)
  } else {
    await runInteractive(client)
  }
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err?.message || err)
  if (err?.status) console.error(`   HTTP ${err.status} — request_id: ${err?.error?.request_id || err?.requestID || 'n/a'}`)
  process.exit(1)
})
