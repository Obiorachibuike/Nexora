import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Append-Only Storage (AOF) — Nexora Docs',
  description: 'Internals of the Nexora append-only log engine, record framing, CRC32 checks, and crash recovery.',
};

export default function StorageDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Storage Engine
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Append-Only Log (AOF) Storage Engine
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora implements its own persistent storage engine capable of persisting key-value records, queue state machines, and event logs with complete crash recovery.
        </p>
      </div>

      <div className="space-y-8 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Supported Storage Operations</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">SET(key, value, [ttlMs])</strong> - Store with optional expiration</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">GET(key)</strong> - Retrieve active value</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">DEL(key)</strong> - Append delete tombstone</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">EXISTS(key)</strong> - Check non-expired existence</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">EXPIRE(key, ttlMs)</strong> - Update key TTL</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">TTL(key)</strong> - Query remaining lifetime in ms</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">SET_NX(key, value)</strong> - Atomic set if absent</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">CAS(key, expect, new)</strong> - Compare and set</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">INCR(key, [delta])</strong> - Atomic 64-bit counter</li>
            <li className="p-2.5 rounded bg-[#10182A] border border-white/5"><strong className="text-white">KEYS([prefix])</strong> - Prefix iteration</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Code Example</h2>
          <CodeBlock
            code={`const store = client.store();

// Store with 30s TTL
await store.set("user:42", { name: "Ada Lovelace" }, { ttlMs: 30000 });

// Atomic counter increment
const views = await store.incr("page:views:home", 1);

// Atomic compare-and-set
const swapped = await store.cas("state:lock", "OPEN", "HELD");`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
