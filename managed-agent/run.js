// ============================================
// RUNTIME — start a session and chat with the agent
// ============================================
// Usage: npm start
//        npm start -- "Fix the dashboard KPI cards"
//
// Prerequisites: Run `npm run setup` first and populate .env

import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "readline";

const client = new Anthropic({ timeout: 120_000 });

// Load config from env
const AGENT_ID = process.env.AGENT_ID;
const AGENT_VERSION = process.env.AGENT_VERSION;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_URL =
  process.env.GITHUB_REPO_URL ||
  "https://github.com/brunosuarez391-star/taller-libra";

function validateConfig() {
  const missing = [];
  if (!AGENT_ID) missing.push("AGENT_ID");
  if (!ENVIRONMENT_ID) missing.push("ENVIRONMENT_ID");
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (missing.length > 0) {
    console.error(
      `Missing required env vars: ${missing.join(", ")}\nRun 'npm run setup' first, then populate .env`
    );
    process.exit(1);
  }
}

async function createSession() {
  const resources = [];

  // Mount GitHub repo if token is available
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

  const session = await client.beta.sessions.create({
    agent: agentRef,
    environment_id: ENVIRONMENT_ID,
    title: `Libra Fleet — ${new Date().toLocaleString("es-AR")}`,
    resources,
  });

  console.log(`Session: ${session.id} (${session.status})`);
  return session;
}

async function sendAndStream(sessionId, text) {
  // Stream-first: open stream before sending
  const stream = await client.beta.sessions.events.stream(sessionId);

  await client.beta.sessions.events.send(sessionId, {
    events: [
      {
        type: "user.message",
        content: [{ type: "text", text }],
      },
    ],
  });

  let fullResponse = "";

  for await (const event of stream) {
    switch (event.type) {
      case "agent.message":
        for (const block of event.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
            fullResponse += block.text;
          }
        }
        break;

      case "agent.thinking":
        // Thinking events — show a subtle indicator
        process.stdout.write("\x1b[2m.\x1b[0m");
        break;

      case "agent.tool_use":
        console.log(`\n\x1b[36m[tool] ${event.name}\x1b[0m`);
        break;

      case "agent.tool_result":
        // Tool finished — the agent continues
        break;

      case "session.status_idle":
        if (event.stop_reason?.type === "requires_action") {
          // Agent needs something from us (custom tool, confirmation)
          continue;
        }
        // Normal completion (end_turn or retries_exhausted)
        break;

      case "session.status_terminated":
        console.log("\n\x1b[33m[session terminated]\x1b[0m");
        return null;

      case "session.error":
        console.error(`\n\x1b[31m[error] ${JSON.stringify(event)}\x1b[0m`);
        break;
    }

    // Break conditions
    if (event.type === "session.status_terminated") break;
    if (
      event.type === "session.status_idle" &&
      event.stop_reason?.type !== "requires_action"
    ) {
      break;
    }
  }

  console.log(); // newline after response
  return fullResponse;
}

async function interactiveLoop(sessionId) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () =>
    new Promise((resolve) => {
      rl.question("\n\x1b[32mVos>\x1b[0m ", (answer) => resolve(answer));
    });

  console.log(
    '\n\x1b[2mEscribí tu mensaje (o "salir" para terminar)\x1b[0m\n'
  );

  while (true) {
    const input = await prompt();
    if (!input || input.toLowerCase() === "salir" || input.toLowerCase() === "exit") {
      console.log("Archivando sesión...");
      // Poll until session is not running before archiving
      for (let i = 0; i < 10; i++) {
        const s = await client.beta.sessions.retrieve(sessionId);
        if (s.status !== "running") break;
        await new Promise((r) => setTimeout(r, 200));
      }
      await client.beta.sessions.archive(sessionId).catch(() => {});
      rl.close();
      break;
    }

    const result = await sendAndStream(sessionId, input);
    if (result === null) {
      rl.close();
      break; // session terminated
    }
  }
}

async function main() {
  validateConfig();

  console.log("=== Libra Fleet Dev Agent ===\n");
  console.log("Creating session...");

  const session = await createSession();

  // If a message was passed as CLI argument, run it and exit
  const cliMessage = process.argv.slice(2).join(" ");

  if (cliMessage) {
    console.log(`\n\x1b[32mVos>\x1b[0m ${cliMessage}\n`);
    await sendAndStream(session.id, cliMessage);
    // Archive session after single-shot
    for (let i = 0; i < 10; i++) {
      const s = await client.beta.sessions.retrieve(session.id);
      if (s.status !== "running") break;
      await new Promise((r) => setTimeout(r, 200));
    }
    await client.beta.sessions.archive(session.id).catch(() => {});
  } else {
    await interactiveLoop(session.id);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
