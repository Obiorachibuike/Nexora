import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Server Configuration — Nexora Docs',
  description: 'Configuration flags, environment variables, and storage synchronization policies for Nexora.',
};

export default function ConfigurationPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Configuration
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Server Configuration
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora supports CLI flags, environment variables, and configuration files with strict startup validation.
        </p>
      </div>

      <div className="space-y-8 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Command-Line Flags</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-text-subtle">
                  <th className="py-2.5">Flag</th>
                  <th className="py-2.5">Default</th>
                  <th className="py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-2.5 text-primary-light">--bind, -b</td>
                  <td>127.0.0.1</td>
                  <td>Network interface to bind TCP and HTTP listeners.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-primary-light">--port, -p</td>
                  <td>6380</td>
                  <td>Binary TCP communication protocol port.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-primary-light">--http-port</td>
                  <td>6381</td>
                  <td>HTTP management & Prometheus metrics port.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-primary-light">--data-dir</td>
                  <td>./data</td>
                  <td>Filesystem path where append-only segment logs are stored.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-primary-light">--api-key</td>
                  <td>None</td>
                  <td>Secret master key required for client authentication.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-primary-light">--durability</td>
                  <td>everysec</td>
                  <td>fsync policy: fsync (flush every write), everysec, none.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Durability Policy Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <div className="p-4 rounded-xl bg-[#0B1020] border border-white/5">
              <span className="text-emerald-400 font-bold text-xs">fsync</span>
              <p className="text-xs text-text-muted mt-1">
                Every write calls <code>fdatasync()</code>. Zero data loss on sudden power cuts. Max safety, ~1,200 writes/sec.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020] border border-white/5">
              <span className="text-primary-light font-bold text-xs">everysec (Default)</span>
              <p className="text-xs text-text-muted mt-1">
                Background thread syncs data every 1,000ms. At most 1 second of unwritten data at risk. High throughput (~28,500 ops/s).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020] border border-white/5">
              <span className="text-amber-400 font-bold text-xs">none</span>
              <p className="text-xs text-text-muted mt-1">
                OS controls dirty buffer flush. Highest possible throughput; suitable for non-critical transient caches.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
