import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Worker Coordination & Leases — Nexora Docs',
  description: 'Worker registration, heartbeats, persistent leases, and fencing tokens in Nexora.',
};

export default function WorkersDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Worker Coordination
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Worker Coordination & Leases
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora coordinates distributed workers across all 20 supported languages using atomic claims, persistent leases, and monotonic fencing tokens.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">How Leases Prevent Concurrency Clashes</h2>
          <p>
            When a worker fetches a job, Nexora assigns a unique lease expiration timestamp (default 30 seconds) and increments an internal fencing token.
            Two workers can never successfully claim the same lease concurrently.
            If a worker machine dies or loses network connectivity, its lease expires, and another worker can safely claim the task without operator intervention.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Worker Concurrency Configuration</h2>
          <CodeBlock
            code={`const queue = client.queue("emails");

await queue.process("welcome-email", async (job) => {
  await sendEmail(job.payload);
}, {
  concurrency: 10,  // Process up to 10 jobs concurrently
  leaseMs: 30000    // 30-second initial lease
});`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
