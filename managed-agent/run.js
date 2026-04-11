// ============================================
// RUNTIME — start a session and chat with the agent
// ============================================
// Usage: npm start
//        npm start -- "Fix the dashboard KPI cards"
//
// Prerequisites: Run `npm run setup` first and populate .env
// Uses native fetch for reliability (SDK has timeout issues with managed agents)

import { createInterface } from "readline";

const API_KEY = process.env.ANTHROPIC_API_KEY;
const AGENT_ID = process.env.AGENT_ID;
const AGENT_VERSION = process.env.AGENT_VERSION;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_URL =
  process.env.GITHUB_REPO_URL ||
  "https://github.com/brunosuarez391-star/taller-libra";

const BASE = "https://api.anthropic.com/v1";
const HEADERS = {
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-beta": "managed-agents-2026-04-01",
  "content-type": "application/json",
};

function validateConfig() {
  const missing = [];
  if (!AGENT_ID) missing.push("AGENT_ID");
  if (!ENVIRONMENT_ID) missing.push("ENVIRONMENT_ID");
  if (!API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (missing.length > 0) {
    console.error(
      `Missing required env vars: ${missing.join(", ")}\nRun 'npm run setup' first, then populate .env`
    );
    process.exit(1);
  }
}

async function apiCall(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

async function createSession() {
  const resources = [];
  if (GITHUB_TOKEN) {
    resources.push({
      type: "github_repository",
      url: GITHUB_REPO_URL,
      authorization_token: GITHUB_TOKEN,
      mount_path: "/workspace/taller-libra",
      checkout: { type: "branch", name: "main" },
    });
  }

  const agentRef = AGENT_VERSION
    ? { type: "agent", id: AGENT_ID, version: parseInt(AGENT_VERSION) }
    : AGENT_ID;

  const session = await apiCall("POST", "/sessions", {
    agent: agentRef,
    environment_id: ENVIRONMENT_ID,
    title: `Libra Fleet — ${new Date().toLocaleString("es-AR")}`,
    resources,
  });

  console.log(`Session: ${session.id} (${session.status})`);
  return session;
}

async function sendMessage(sessionId, text) {
  await apiCall("POST", `/sessions/${sessionId}/events`, {
    events: [
      {
        type: "user.message",
        content: [{ type: "text", text }],
      },
    ],
  });
}

async function streamEvents(sessionId) {
  const res = await fetch(`${BASE}/sessions/${sessionId}/events/stream`, {
    headers: {
      ...HEADERS,
      Accept: "text/event-stream",
    },
  });

  if (!res.ok) {
    throw new Error(`Stream error ${res.status}: ${await res.text()}`);
  }

  return res.body;
}

function parseSSE(chunk) {
  const lines = chunk.split("\n");
  const events = [];
  let currentData = "";
  let currentEvent = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      currentData = line.slice(6);
    } else if (line === "" && currentData) {
      try {
        events.push({ type: currentEvent, data: JSON.parse(currentData) });
      } catch {}
      currentData = "";
      currentEvent = "";
    }
  }
  return events;
}

async function sendAndStream(sessionId, text) {
  // Stream-first: open stream before sending
  const streamPromise = streamEvents(sessionId);
  await sendMessage(sessionId, text);
  const body = await streamPromise;

  const decoder = new TextDecoder();
  let fullResponse = "";
  let buffer = "";

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });

    // Process complete SSE events
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (!part.trim()) continue;

      const events = parseSSE(part + "\n\n");
      for (const { data: event } of events) {
        if (!event || !event.type) continue;

        switch (event.type) {
          case "agent.message":
            if (event.content) {
              for (const block of event.content) {
                if (block.type === "text") {
                  process.stdout.write(block.text);
                  fullResponse += block.text;
                }
              }
            }
            break;

          case "agent.thinking":
            process.stdout.write("\x1b[2m.\x1b[0m");
            break;

          case "agent.tool_use":
            console.log(`\n\x1b[36m[tool] ${event.name}\x1b[0m`);
            break;

          case "session.status_idle":
            if (event.stop_reason?.type === "requires_action") continue;
            console.log();
            return fullResponse;

          case "session.status_terminated":
            console.log("\n\x1b[33m[session terminated]\x1b[0m");
            return null;

          case "session.error":
            console.error(`\n\x1b[31m[error] ${JSON.stringify(event)}\x1b[0m`);
            break;
        }
      }
    }
  }

  console.log();
  return fullResponse;
}

async function archiveSession(sessionId) {
  // Poll until not running, then archive
  for (let i = 0; i < 10; i++) {
    const s = await apiCall("GET", `/sessions/${sessionId}`);
    if (s.status !== "running") break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await apiCall("POST", `/sessions/${sessionId}/archive`).catch(() => {});
}

async function interactiveLoop(sessionId) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () =>
    new Promise((resolve) => {
      rl.question("\n\x1b[32mVos>\x1b[0m ", resolve);
    });

  console.log('\n\x1b[2mEscribí tu mensaje (o "salir" para terminar)\x1b[0m\n');

  while (true) {
    const input = await prompt();
    if (!input || input.toLowerCase() === "salir" || input.toLowerCase() === "exit") {
      console.log("Archivando sesión...");
      await archiveSession(sessionId);
      rl.close();
      break;
    }

    const result = await sendAndStream(sessionId, input);
    if (result === null) {
      rl.close();
      break;
    }
  }
}

async function main() {
  validateConfig();

  console.log("=== Libra Fleet Dev Agent ===\n");
  console.log("Creating session...");

  const session = await createSession();

  const cliMessage = process.argv.slice(2).join(" ");

  if (cliMessage) {
    console.log(`\n\x1b[32mVos>\x1b[0m ${cliMessage}\n`);
    await sendAndStream(session.id, cliMessage);
    await archiveSession(session.id);
  } else {
    await interactiveLoop(session.id);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
