import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Delayed Jobs — Nexora Docs',
  description: 'Schedule one-time future jobs with millisecond precision in Nexora.',
};

export default function DelayedJobsDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Execution Timing
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Delayed Job Execution
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Queue tasks that must not execute immediately, but instead wait until a specific delay or future timestamp has passed.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Delaying Job Execution</h2>
          <p className="mb-3">
            Pass <code>delayMs</code> when adding a job to hold it in the <code>Delayed</code> state:
          </p>
          <CodeBlock
            code={`const queue = client.queue("reminders");

// Execute after a 15-minute delay (900,000 ms)
const job = await queue.add("send-followup", {
  userId: "usr_581",
  message: "Did you find everything you needed?"
}, {
  delayMs: 15 * 60 * 1000
});`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
