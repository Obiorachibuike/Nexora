import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Retries & Exponential Backoff — Nexora Docs',
  description: 'Automatic retries, backoff policies, jitter, and dead-letter queue routing in Nexora.',
};

export default function RetriesDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Error Handling
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Retries & Exponential Backoff
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Configure how Nexora handles task failures, computes retry delays, and routes exhausted jobs to Dead-Letter Queues.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Backoff Formula</h2>
          <p>
            When a worker reports a job failure (<code>Q_FAIL</code>), Nexora computes the delay for the next attempt using exponential backoff:
          </p>
          <div className="p-3 rounded-lg bg-[#0B1020] border border-white/10 font-mono text-xs text-accent my-3">
            delay_ms = base_backoff_ms * (2 ^ (attempt_count - 1))
          </div>
          <p>
            For example, with a base backoff of 1,000ms: Attempt 1 delays 1s, Attempt 2 delays 2s, Attempt 3 delays 4s, Attempt 4 delays 8s, and so forth.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Dead-Letter Queue (DLQ) Routing</h2>
          <p>
            When a job reaches <code>maxAttempts</code>, it permanently transitions to the <code>DeadLettered</code> state and is removed from active worker claiming.
            Operators can inspect the last error message, error stack, and request payload via the CLI:
          </p>
          <CodeBlock
            code={`nexora job inspect <job_id>\nnexora job retry <job_id>`}
            language="bash"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
