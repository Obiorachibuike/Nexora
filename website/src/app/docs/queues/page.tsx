import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Durable Background Queues — Nexora Docs',
  description: '7-state machine, atomic claiming, priority scheduling, and delivery semantics in Nexora queues.',
};

export default function QueuesDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Queue Engine
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Durable Background Queues
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora implements an independent persistent job queue built on top of its append-only storage engine.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Job State Machine</h2>
          <p className="mb-3">
            Every job transitions through well-defined lifecycle states:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">Waiting:</strong> Ready to be claimed by eligible workers</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-amber-400">Delayed:</strong> Scheduled to run at a future timestamp</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-accent">Active:</strong> Leased by an active worker under fencing token</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-emerald-400">Completed:</strong> Terminal state after acknowledgment</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-rose-400">Failed:</strong> Errored during processing; queued for backoff</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-red-500 font-bold">DeadLettered:</strong> Exhausted all retry attempts</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Adding and Processing Jobs</h2>
          <CodeBlock
            code={`const queue = client.queue("video-processing");

// Add job with high priority (20) and max 5 attempts
const job = await queue.add("transcode-1080p", {
  fileId: "vid_9941"
}, {
  priority: 20,
  maxAttempts: 5,
  backoffMs: 2000
});

// Worker processing loop
await queue.process("transcode-1080p", async (job) => {
  console.log("Transcoding video:", job.payload.fileId);
}, { concurrency: 4, leaseMs: 60000 });`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
