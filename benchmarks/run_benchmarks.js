const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');
const { NexoraServer } = require('../server/src/server');
const { NexoraClient } = require('../sdks/typescript/dist/client');

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runBenchmarks() {
  console.log('======================================================');
  console.log('          NEXORA OFFICIAL BENCHMARK SUITE             ');
  console.log('======================================================\n');

  const benchDir = path.resolve(__dirname, '../data-benchmarks');
  if (fs.existsSync(benchDir)) {
    fs.rmSync(benchDir, { recursive: true, force: true });
  }

  const tcpPort = 6490;
  const httpPort = 6491;

  const server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: benchDir,
    durability: 'everysec',
  });
  await server.start();

  const client = new NexoraClient({ host: '127.0.0.1', port: tcpPort });
  await client.connect();
  const store = client.store();
  const queue = client.queue('benchmarks');

  const WARMUP_COUNT = 100;
  const BENCH_COUNT = 1000;

  // Warmup
  for (let i = 0; i < WARMUP_COUNT; i++) {
    await store.set(`warmup:${i}`, `val_${i}`);
    await store.get(`warmup:${i}`);
  }

  console.log(`Executing ${BENCH_COUNT} operations per benchmark scenario...\n`);

  // Scenario 1: Key-Value SET
  const setLatencies = [];
  const setStart = performance.now();
  for (let i = 0; i < BENCH_COUNT; i++) {
    const t0 = performance.now();
    await store.set(`bench:kv:${i}`, `payload_data_${i}`);
    setLatencies.push(performance.now() - t0);
  }
  const setDuration = (performance.now() - setStart) / 1000;
  const setOpsPerSec = (BENCH_COUNT / setDuration).toFixed(0);

  // Scenario 2: Key-Value GET
  const getLatencies = [];
  const getStart = performance.now();
  for (let i = 0; i < BENCH_COUNT; i++) {
    const t0 = performance.now();
    await store.get(`bench:kv:${i}`);
    getLatencies.push(performance.now() - t0);
  }
  const getDuration = (performance.now() - getStart) / 1000;
  const getOpsPerSec = (BENCH_COUNT / getDuration).toFixed(0);

  // Scenario 3: Queue Add (Q_ADD)
  const qAddLatencies = [];
  const qAddStart = performance.now();
  const jobIds = [];
  for (let i = 0; i < BENCH_COUNT; i++) {
    const t0 = performance.now();
    const j = await queue.add(`task-${i}`, { index: i, timestamp: Date.now() });
    qAddLatencies.push(performance.now() - t0);
    jobIds.push(j.id);
  }
  const qAddDuration = (performance.now() - qAddStart) / 1000;
  const qAddOpsPerSec = (BENCH_COUNT / qAddDuration).toFixed(0);

  // Scenario 4: Queue Claim & Ack
  const qClaimLatencies = [];
  const qClaimStart = performance.now();
  for (let i = 0; i < BENCH_COUNT; i++) {
    const t0 = performance.now();
    const j = await queue.fetchNext('bench-worker', 10000);
    if (j) {
      await queue.ack(j.id, 'bench-worker', j.fencingToken);
    }
    qClaimLatencies.push(performance.now() - t0);
  }
  const qClaimDuration = (performance.now() - qClaimStart) / 1000;
  const qClaimOpsPerSec = (BENCH_COUNT / qClaimDuration).toFixed(0);

  // Results Table
  console.log('-----------------------------------------------------------------------------------------');
  console.log(
    'Workload'.padEnd(25) +
    'Throughput'.padEnd(16) +
    'p50 Latency'.padEnd(14) +
    'p95 Latency'.padEnd(14) +
    'p99 Latency'
  );
  console.log('-----------------------------------------------------------------------------------------');

  const report = [
    {
      name: 'Key-Value SET (AOF)',
      tps: `${setOpsPerSec} ops/s`,
      p50: `${percentile(setLatencies, 50).toFixed(2)} ms`,
      p95: `${percentile(setLatencies, 95).toFixed(2)} ms`,
      p99: `${percentile(setLatencies, 99).toFixed(2)} ms`,
    },
    {
      name: 'Key-Value GET (Cache)',
      tps: `${getOpsPerSec} ops/s`,
      p50: `${percentile(getLatencies, 50).toFixed(2)} ms`,
      p95: `${percentile(getLatencies, 95).toFixed(2)} ms`,
      p99: `${percentile(getLatencies, 99).toFixed(2)} ms`,
    },
    {
      name: 'Queue Enqueue (Q_ADD)',
      tps: `${qAddOpsPerSec} jobs/s`,
      p50: `${percentile(qAddLatencies, 50).toFixed(2)} ms`,
      p95: `${percentile(qAddLatencies, 95).toFixed(2)} ms`,
      p99: `${percentile(qAddLatencies, 99).toFixed(2)} ms`,
    },
    {
      name: 'Queue Claim & Ack',
      tps: `${qClaimOpsPerSec} jobs/s`,
      p50: `${percentile(qClaimLatencies, 50).toFixed(2)} ms`,
      p95: `${percentile(qClaimLatencies, 95).toFixed(2)} ms`,
      p99: `${percentile(qClaimLatencies, 99).toFixed(2)} ms`,
    },
  ];

  for (const r of report) {
    console.log(
      r.name.padEnd(25) +
      r.tps.padEnd(16) +
      r.p50.padEnd(14) +
      r.p95.padEnd(14) +
      r.p99
    );
  }
  console.log('-----------------------------------------------------------------------------------------\n');

  await client.close();
  await server.close();
  fs.rmSync(benchDir, { recursive: true, force: true });
}

runBenchmarks().catch(console.error);
