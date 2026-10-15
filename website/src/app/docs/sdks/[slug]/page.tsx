import React from 'react';
import { notFound } from 'next/navigation';
import { SDKS, SdkMeta } from '../../../../data/sdks';
import { DocsLayout } from '../../../../components/DocsLayout';
import { CodeBlock } from '../../../../components/CodeBlock';
import { ArrowLeft, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function generateStaticParams() {
  return SDKS.map((sdk) => ({
    slug: sdk.slug,
  }));
}

export default function SdkDocsPage({ params }: { params: { slug: string } }) {
  const sdk = SDKS.find((s) => s.slug === params.slug);
  if (!sdk) {
    notFound();
  }

  const badgeColor =
    sdk.status === 'Stable'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : sdk.status === 'Beta'
      ? 'bg-primary/15 text-primary-light border-primary/30'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

  return (
    <DocsLayout>
      <div className="mb-8">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1 text-xs text-text-subtle hover:text-white transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to SDK Directory
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {sdk.name} SDK
          </h1>
          <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
            {sdk.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {sdk.description}
        </p>
      </div>

      <div className="space-y-8 text-sm text-text-muted leading-relaxed">
        {/* Specification Metadata Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#10182A] border border-white/5 text-xs font-mono">
          <div>
            <span className="text-text-subtle block">Package:</span>
            <span className="text-white font-semibold">{sdk.packageName}</span>
          </div>
          <div>
            <span className="text-text-subtle block">Registry:</span>
            <span className="text-white font-semibold">{sdk.registry}</span>
          </div>
          <div>
            <span className="text-text-subtle block">Min Version:</span>
            <span className="text-white font-semibold">{sdk.minVersion}</span>
          </div>
          <div>
            <span className="text-text-subtle block">Server Compat:</span>
            <span className="text-emerald-400 font-semibold">NBP/1.0 (v0.1+)</span>
          </div>
        </div>

        {/* 1. Installation */}
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Installation</h2>
          <CodeBlock code={sdk.installCmd} language="bash" />
        </section>

        {/* 2. Connection & Key-Value */}
        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. Connection & Key-Value Operations</h2>
          <p className="mb-2 text-xs">
            Connect to the Nexora server over TCP and perform durable key-value storage and TTL operations:
          </p>
          <CodeBlock code={sdk.codeSnippet} language={sdk.slug} />
        </section>

        {/* 3. Background Job Queues & Worker */}
        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Background Job Queue & Worker Processing</h2>
          <p className="mb-2 text-xs">
            Coordinate worker leases, handle job completion acknowledgments, and report errors with exponential backoff:
          </p>
          <CodeBlock code={sdk.workerSnippet} language={sdk.slug} />
        </section>

        {/* 4. Error Handling & Reconnection */}
        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Error Handling & Reconnection</h2>
          <p className="text-xs">
            All SDK methods throw typed errors mapping to Nexora protocol status codes:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs font-mono">
            <li>• <code className="text-rose-400">AuthenticationError</code>: API key failed constant-time check (0x0003).</li>
            <li>• <code className="text-amber-400">NotFoundError</code>: Requested key or job ID does not exist (0x0002).</li>
            <li>• <code className="text-rose-400">LeaseExpiredError</code>: Worker lease expired or was fenced out (0x0007).</li>
            <li>• <code className="text-rose-400">ConnectionError</code>: Socket disconnect or TCP timeout.</li>
          </ul>
        </section>

        {/* 5. Source Code Link */}
        <section className="pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-text-subtle">
            SDK source directory: <code className="text-slate-300">sdks/{sdk.slug}/</code>
          </span>
          <a
            href={`https://github.com/Obiorachibuike/Nexora/tree/main/sdks/${sdk.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-primary-light hover:text-white transition font-medium"
          >
            <span>View SDK Source on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>
      </div>
    </DocsLayout>
  );
}
