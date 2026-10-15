import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Troubleshooting — Nexora Docs',
  description: 'Common troubleshooting steps, error codes, and recovery procedures for Nexora.',
};

export default function TroubleshootingDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Diagnostics
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Troubleshooting & Error Codes
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Diagnose connection problems, worker lease expirations, and unexpected server restarts.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Protocol Status Codes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-text-subtle">
                  <th className="py-2">Code</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr><td className="text-emerald-400">0x0000</td><td>OK</td><td>Success</td></tr>
                <tr><td className="text-amber-400">0x0002</td><td>NOT_FOUND</td><td>Target key or job does not exist</td></tr>
                <tr><td className="text-rose-400">0x0003</td><td>UNAUTHORIZED</td><td>API key missing or failed constant-time check</td></tr>
                <tr><td className="text-rose-400">0x0004</td><td>BAD_REQUEST</td><td>Payload malformed or schema invalid</td></tr>
                <tr><td className="text-rose-500">0x0007</td><td>LEASE_EXPIRED</td><td>Worker lease expired; task reclaimed by another worker</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Diagnosing with `nexora doctor`</h2>
          <CodeBlock code={`./bin/nexora.js doctor`} language="bash" />
        </section>
      </div>
    </DocsLayout>
  );
}
