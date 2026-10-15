import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Security & Access Control — Nexora Docs',
  description: 'Authentication, API key configuration, and security practices in Nexora.',
};

export default function SecurityDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Security
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Authentication & Access Control
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora enforces constant-time credential comparison, zero exposed credentials, and framed payload limits.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Enabling Authentication</h2>
          <p className="mb-3">
            Pass the <code>--api-key</code> parameter when launching the server:
          </p>
          <CodeBlock
            code={`./bin/nexora-server.js --api-key "nx_prod_secret_8492048"`}
            language="bash"
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Connecting Authenticated Clients</h2>
          <CodeBlock
            code={`const client = new NexoraClient({
  host: "127.0.0.1",
  port: 6380,
  apiKey: process.env.NEXORA_API_KEY
});

await client.connect();`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
