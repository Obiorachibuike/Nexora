export interface UseCase {
  id: string;
  title: string;
  tagline: string;
  description: string;
  architecture: string[];
  considerations: string[];
  codeExample: string;
}

export const USE_CASES: UseCase[] = [
  {
    id: 'transactional-emails',
    title: 'Transactional Email & Notification Pipeline',
    tagline: 'High-throughput outbound delivery with guaranteed retries and rate limit protection',
    description: 'When users sign up, request password resets, or make purchases, outbound notifications must be delivered reliably without blocking API response threads or losing messages during third-party provider outages.',
    architecture: [
      'Web API server enqueues an email job to Nexora queue "emails:outbound" with priority and idempotent deduplication key.',
      'Nexora guarantees durable disk append before acknowledging enqueue request.',
      'Worker pool claims batch of jobs with 30-second leases.',
      'Worker attempts delivery through SendGrid / Postmark / SES API.',
      'Upon success, worker sends Q_ACK with lease fencing token. On rate-limit or 5xx, worker reports Q_FAIL with exponential backoff delay.',
    ],
    considerations: [
      'Idempotent dedup key prevents duplicate emails if upstream client retries.',
      'Fencing token protects against duplicate delivery if worker experiences garbage collection pause.',
      'Automatic dead-letter queue routing prevents bad addresses from poisoning the queue.',
    ],
    codeExample: `import { NexoraClient } from '@nexora/client';

const client = new NexoraClient({ host: '127.0.0.1', port: 6380, apiKey: process.env.NEXORA_KEY });
await client.connect();

// Enqueue transactional email with deduplication key
await client.queue.add('emails:outbound', {
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'Alex' },
}, {
  priority: 15, // Higher than marketing batches
  dedupKey: 'welcome:user:9812',
  maxRetries: 5,
});`,
  },
  {
    id: 'ai-document-processing',
    title: 'AI Document Parsing & Vector Ingestion',
    tagline: 'Long-running multi-stage CPU/GPU workloads with durable progress checkpoints',
    description: 'Processing 500-page PDF documents for RAG systems requires OCR, chunking, embedding generation, and vector database indexing. Each stage can take seconds to minutes and must survive worker spot-instance terminations.',
    architecture: [
      'Document uploaded to S3; upload handler enqueues parsing job in "docs:ingest" queue.',
      'GPU worker claims job with 10-minute lease and fencing token.',
      'Worker periodically updates progress checkpoint in Nexora Key-Value store.',
      'Worker completes embeddings, indexes vectors, and acknowledges job in Nexora.',
      'Event published to "docs:ready" topic to notify connected frontend clients.',
    ],
    considerations: [
      'Heartbeat lease extension prevents false expirations on large documents.',
      'Key-Value store holds intermediate token counts and chunk hashes for crash-resilience.',
      'Dead-letter routing captures corrupt or password-protected PDF files.',
    ],
    codeExample: `// Worker loop with progress tracking
const job = await client.queue.fetchJob('docs:ingest', 'worker-gpu-01', 600000);
if (job) {
  const { docId, fileUrl } = job.payload;
  await client.store.set(\`doc:\${docId}:status\`, { state: 'chunking', progress: 0.25 });
  
  // Perform chunking and embedding generation...
  await generateEmbeddings(fileUrl);
  
  await client.store.set(\`doc:\${docId}:status\`, { state: 'completed', progress: 1.0 });
  await client.queue.ack(job.id, 'worker-gpu-01', job.leaseToken);
  await client.events.publish('docs:ready', { docId });
}`,
  },
  {
    id: 'webhook-delivery',
    title: 'Outbound Webhook Delivery Engine',
    tagline: 'Reliable webhook dispatch with per-subscriber rate limiting and exponential backoff',
    description: 'Platforms sending events to third-party customer webhooks face erratic endpoint latencies, intermittent downtime, and slow servers. Nexora handles millions of webhook deliveries with per-domain queuing and graceful backoff.',
    architecture: [
      'Core application publishes domain events to Nexora topic "billing:invoices".',
      'Webhook dispatcher consumer group receives event and enqueues webhook jobs per subscriber URL.',
      'Dispatcher workers claim jobs and execute HTTP POST with signature header.',
      'If endpoint returns HTTP 429 or 503, job is rescheduled with exponential backoff and jitter.',
      'If all 8 retries fail, webhook payload is routed to customer-facing DLQ for replay.',
    ],
    considerations: [
      'Jittered backoff prevents thundering herd against customer servers.',
      'Custom worker timeouts ensure hanging sockets do not stall queue workers.',
    ],
    codeExample: `// Webhook dispatcher retry handler
try {
  const res = await fetch(job.payload.targetUrl, {
    method: 'POST',
    body: JSON.stringify(job.payload.event),
    headers: { 'X-Signature': sign(job.payload.event) },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  await client.queue.ack(job.id, workerId, job.leaseToken);
} catch (err) {
  // Report failure; Nexora automatically calculates 2^attempt backoff
  await client.queue.fail(job.id, workerId, job.leaseToken, err.message);
}`,
  },
  {
    id: 'ecommerce-checkout',
    title: 'E-Commerce Order Fulfillment & Inventory Reservation',
    tagline: 'Atomic inventory reservation with delayed release and multi-system reconciliation',
    description: 'During flash sales, customers put items in carts that must be held for 15 minutes. If checkout does not complete, inventory must be released automatically back to available stock.',
    architecture: [
      'Customer starts checkout: Nexora executes atomic decrement on stock key in Key-Value store.',
      'System enqueues a delayed job in Nexora queue "orders:release-stock" scheduled for +15 minutes.',
      'If payment succeeds, checkout handler cancels delayed job with Q_CANCEL and enqueues fulfillment.',
      'If payment fails or customer abandons, delayed job triggers after 15 minutes, claims stock, and re-increments inventory.',
    ],
    considerations: [
      'Atomic INCR/DECR prevents overselling down to exact stock counts.',
      'Delayed job queue removes the need for recurring database polling sweeps.',
    ],
    codeExample: `// 1. Reserve inventory atomically
const remaining = await client.store.decr('stock:item:992');
if (remaining < 0) {
  await client.store.incr('stock:item:992'); // Rollback
  throw new Error('Out of stock');
}

// 2. Schedule automatic stock release in 15 minutes
const releaseJob = await client.queue.add('orders:release-stock', {
  itemId: 'item:992',
  quantity: 1,
  orderId: 'ord_123',
}, {
  delayMs: 15 * 60 * 1000,
});`,
  },
  {
    id: 'recurring-reports',
    title: 'Financial Reconciliation & Daily Aggregations',
    tagline: 'Precision recurring scheduler with automatic crash recovery and misfire protection',
    description: 'Daily ledger reconciliation, monthly billing statements, and hourly telemetry rollups require durable cron scheduling that guarantees execution even if servers restart during maintenance windows.',
    architecture: [
      'Schedule registered with Nexora SCH_ADD specifying cron pattern or millisecond interval.',
      'Schedule definition persisted durably to append-only log under "schedule:<id>".',
      'Nexora background scheduler loop monitors epoch timestamps and pushes jobs to target queues when window opens.',
      'Workers process heavy reporting queries and write summaries to cold storage.',
    ],
    considerations: [
      'Misfire policy prevents cascading runs if engine was offline during scheduled window.',
      'Separate worker queue isolates heavy analytical queries from fast operational jobs.',
    ],
    codeExample: `// Register daily reconciliation schedule
await client.scheduler.create({
  id: 'daily-ledger-reconciliation',
  intervalMs: 24 * 60 * 60 * 1000, // Every 24 hours
  targetQueue: 'reports:financial',
  payload: { reportType: 'ledger_audit' },
  misfirePolicy: 'FireOnce',
});`,
  },
  {
    id: 'api-response-caching',
    title: 'Sub-Millisecond Multi-Tier API Caching',
    tagline: 'High-speed Key-Value cache with TTL expiration and atomic compare-and-swap',
    description: 'High-traffic API gateways need to cache expensive GraphQL query results, authorization claims, and tenant configuration with microsecond response times and bounded memory footprints.',
    architecture: [
      'API gateway receives incoming client request.',
      'Checks Nexora Key-Value store using binary TCP protocol (0.1ms p50 latency).',
      'On cache hit, deserializes cached payload and returns immediate response.',
      'On cache miss, evaluates backend database, sets value in Nexora with 60-second TTL.',
    ],
    considerations: [
      'TTL is tracked durably in memory and segment log with millisecond granularity.',
      'Hot caching layer provides LRU eviction if memory threshold is reached.',
    ],
    codeExample: `// Microsecond cache lookup
let userClaims = await client.store.get(\`auth:claims:\${userId}\`);
if (!userClaims) {
  userClaims = await database.fetchUserClaims(userId);
  await client.store.set(\`auth:claims:\${userId}\`, userClaims, { ttlMs: 300000 });
}
return userClaims;`,
  },
];
