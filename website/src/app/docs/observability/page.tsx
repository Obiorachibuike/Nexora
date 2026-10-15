import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Observability & Metrics — Nexora Docs',
  description: 'Prometheus metrics, health endpoints, and queue diagnostics in Nexora.',
};

export default function ObservabilityDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Observability
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Observability, Metrics & Diagnostics
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Monitor your server health, queue depths, error rates, and storage metrics in real time.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">HTTP Management Endpoints (Port 6381)</h2>
          <ul className="space-y-2 text-xs font-mono">
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-emerald-400">GET /health</strong> - Liveness probe</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-emerald-400">GET /ready</strong> - Readiness probe & active connections</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-accent">GET /metrics</strong> - Operational metrics snapshot</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-accent">GET /api/v1/stats</strong> - Server version, storage key counts, request tallies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Querying Metrics via CLI</h2>
          <CodeBlock
            code={`nexora status\nnexora storage status`}
            language="bash"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
