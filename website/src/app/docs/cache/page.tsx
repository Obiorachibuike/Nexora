import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'High-Performance Cache — Nexora Docs',
  description: 'In-memory caching, TTL expiration, and LRU eviction in the Nexora engine.',
};

export default function CacheDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Caching
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          High-Performance Cache
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora includes a hot in-memory cache layer providing sub-millisecond access for high-throughput read workloads.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Durable Storage vs. Evictable Cache</h2>
          <p>
            Entries written without TTL or with standard persistence remain safe in the append-only log.
            Entries written with short TTLs or targeted cache keys can be evicted under LRU policies when memory pressure exceeds configured limits, ensuring your application never crashes from out-of-memory errors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Usage Example</h2>
          <CodeBlock
            code={`// Cache expensive database query for 60 seconds
const cacheKey = "products:featured";
let products = await store.get(cacheKey);

if (!products) {
  products = await fetchFromDatabase();
  await store.set(cacheKey, products, { ttlMs: 60000 });
}`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
