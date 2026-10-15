import React from 'react';
import Link from 'next/link';
import { DocsLayout } from '../../components/DocsLayout';
import { Terminal, Database, Layers, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const metadata = {
  title: 'Documentation Overview — Nexora',
  description: 'Official technical documentation and API reference for the Nexora infrastructure platform.',
};

export default function DocsHomePage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Documentation
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Nexora Engineering Documentation
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Welcome to the official developer documentation for Nexora. Learn how to install the server, connect using any of our 20 official SDKs, configure append-only durability, and process background jobs reliably.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/docs/getting-started"
          className="p-5 rounded-xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between group"
        >
          <div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary-light w-fit mb-3">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-primary-light transition mb-1">
              Quickstart Tutorial
            </h3>
            <p className="text-xs text-text-muted">
              From zero to your first durable key-value write and background job execution in 3 minutes.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs text-primary-light font-semibold">
            Start tutorial <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </span>
        </Link>

        <Link
          href="/docs/protocol"
          className="p-5 rounded-xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between group"
        >
          <div>
            <div className="p-2.5 rounded-lg bg-accent/10 text-accent w-fit mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-primary-light transition mb-1">
              Protocol Specification
            </h3>
            <p className="text-xs text-text-muted">
              Deep-dive into the 24-byte binary wire framing (NBP/1.0), correlation IDs, and CRC16 checks.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs text-accent font-semibold">
            View wire specs <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </span>
        </Link>

        <Link
          href="/docs/queues"
          className="p-5 rounded-xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between group"
        >
          <div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-primary-light transition mb-1">
              Durable Queues & Leases
            </h3>
            <p className="text-xs text-text-muted">
              7-state machine, atomic claiming, fencing tokens, exponential backoff, and dead-letter queues.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-emerald-400 font-semibold">
            Explore queues <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </span>
        </Link>

        <Link
          href="/docs/sdks/typescript"
          className="p-5 rounded-xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between group"
        >
          <div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-primary-light transition mb-1">
              SDK References
            </h3>
            <p className="text-xs text-text-muted">
              Explore language guides for TypeScript, Python, Go, Rust, C++, C, Java, C#, and 12 more.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-purple-400 font-semibold">
            Browse SDKs <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </span>
        </Link>
      </div>
    </DocsLayout>
  );
}
