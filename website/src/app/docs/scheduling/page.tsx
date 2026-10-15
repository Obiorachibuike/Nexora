import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Recurring Job Scheduling — Nexora Docs',
  description: 'Cron scheduling, recurring intervals, and misfire recovery policies in Nexora.',
};

export default function SchedulingDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Scheduler
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Recurring Job Scheduling
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora includes a persistent recurring job scheduler supporting intervals, cron expressions, and offline misfire policies.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Misfire Handling: Skip vs. FireOnce</h2>
          <p>
            If the server is temporarily stopped during a scheduled trigger window, the misfire policy controls what happens upon restart:
          </p>
          <ul className="space-y-2 mt-2">
            <li>• <strong className="text-white">Skip:</strong> Skips missed execution windows and calculates the next future run timestamp.</li>
            <li>• <strong className="text-white">FireOnce:</strong> Immediately triggers one catch-up execution before returning to the normal schedule cadence.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Defining a Schedule</h2>
          <CodeBlock
            code={`// Register nightly synchronization schedule
await scheduler.addIntervalSchedule(
  "nightly-sync",
  "data-pipelines",
  24 * 60 * 60 * 1000, // 24 hours in ms
  { dataset: "all_tenants" },
  "FireOnce"
);`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
