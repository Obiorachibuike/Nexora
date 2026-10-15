import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Quickstart Tutorial — Nexora Docs',
  description: 'Get started with Nexora in under 5 minutes: start the server, connect a client, store persistent keys, and dispatch background jobs.',
};

export default function GettingStartedPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Tutorial
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Quickstart: Zero to Working Background Jobs
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          This tutorial walks you through launching the Nexora server, connecting an official SDK client, persisting data to disk, and executing background jobs with automatic worker lease coordination.
        </p>
      </div>

      <div className="space-y-8 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. Prerequisites</h2>
          <p>
            Nexora runs as an independent single-binary server. You do not need Redis, BullMQ, Docker, or PostgreSQL installed.
            Ensure you have Node.js 18+ or Python 3.8+ on your machine.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. Start the Nexora Server</h2>
          <p>
            Launch the Nexora engine specifying the TCP protocol port (default <code>6380</code>) and HTTP management port (default <code>6381</code>):
          </p>
          <CodeBlock
            code={`./bin/nexora-server.js --port 6380 --http-port 6381 --data-dir ./data`}
            language="bash"
          />
          <p className="mt-2 text-xs">
            The server automatically initializes its append-only storage engine in <code>./data</code>, creates segment logs, and verifies startup health.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. Verify Server Health</h2>
          <p>
            You can verify server health using curl or the Nexora CLI tool:
          </p>
          <CodeBlock
            code={`curl http://127.0.0.1:6381/health\n# Returns: {"status":"healthy","engine":"Nexora","version":"0.1.0"}`}
            language="bash"
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. Install the SDK</h2>
          <p>
            Install the official client library in your application:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            <div>
              <span className="text-xs font-mono text-text-subtle">TypeScript / Node.js:</span>
              <CodeBlock code="npm install @nexora/client" language="bash" />
            </div>
            <div>
              <span className="text-xs font-mono text-text-subtle">Python:</span>
              <CodeBlock code="pip install nexora" language="bash" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Submit Jobs and Store Keys</h2>
          <p>
            Create an application script that connects to the server, stores key-value pairs with TTL, and queues background jobs:
          </p>
          <CodeBlock
            code={`import { NexoraClient } from "@nexora/client";

async function main() {
  const client = new NexoraClient({ host: "127.0.0.1", port: 6380 });
  await client.connect();

  // Key-Value with 60-second TTL
  const store = client.store();
  await store.set("session:user_42", { name: "Ada", role: "admin" }, { ttlMs: 60000 });
  console.log("Cached session:", await store.get("session:user_42"));

  // Durable Queue Dispatch
  const queue = client.queue("emails");
  const job = await queue.add("welcome-email", {
    email: "ada@lovelace.dev"
  }, { priority: 10 });
  console.log("Submitted background job:", job.id);

  // Worker Processing
  const worker = await queue.process("welcome-email", async (job) => {
    console.log("Processing email for:", job.payload.email);
  });

  // Keep alive or close
  setTimeout(async () => {
    worker.stop();
    await client.close();
  }, 2000);
}

main();`}
            language="typescript"
            filename="quickstart.ts"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
