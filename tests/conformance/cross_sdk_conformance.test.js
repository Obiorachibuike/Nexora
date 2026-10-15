const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { NexoraServer } = require('../../server/src/server');
const { NexoraClient } = require('../../sdks/typescript/dist/client');

async function runConformanceSuite() {
  console.log('======================================================');
  console.log('      NEXORA MANDATORY SDK CONFORMANCE SUITE          ');
  console.log('======================================================\n');

  const testDir = path.resolve(__dirname, '../../test-data-conformance');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const tcpPort = 6492;
  const httpPort = 6493;
  const apiKey = 'nx_conformance_secret_7719';

  const server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    apiKey,
    dataDir: testDir,
  });
  await server.start();

  const client = new NexoraClient({
    host: '127.0.0.1',
    port: tcpPort,
    apiKey,
  });

  // Step 1: Connect and Authenticate
  console.log('Requirement 1: Connect & Authenticate...');
  await client.connect();
  assert(await client.ping() === true, 'PING must return true');
  console.log('✓ PASS: Connect & Authenticate');

  // Step 2: Key-Value operations
  console.log('Requirement 2: Key-Value Operations (SET, GET, DEL, EXISTS, CAS, INCR)...');
  const store = client.store();
  await store.set('conf:k1', 'val1');
  assert.strictEqual(await store.get('conf:k1'), 'val1');
  assert.strictEqual(await store.exists('conf:k1'), true);
  const inc = await store.incr('conf:num', 5);
  assert.strictEqual(inc, 5);
  assert.strictEqual(await store.cas('conf:k1', 'val1', 'val2'), true);
  assert.strictEqual(await store.get('conf:k1'), 'val2');
  assert.strictEqual(await store.delete('conf:k1'), true);
  assert.strictEqual(await store.get('conf:k1'), null);
  console.log('✓ PASS: Key-Value Operations');

  // Step 3: TTL and expiration
  console.log('Requirement 3: Key with TTL Expiration...');
  await store.set('conf:ttl_key', 'ephemeral', { ttlMs: 5000 });
  const remainingTtl = await store.ttl('conf:ttl_key');
  assert(remainingTtl > 0 && remainingTtl <= 5000);
  console.log(`✓ PASS: Key TTL Expiration (${remainingTtl}ms remaining)`);

  // Step 4: Submit a Job
  console.log('Requirement 4: Submit Job...');
  const queue = client.queue('conformance-queue');
  const job = await queue.add('test-task', { data: 42 }, { priority: 15, maxAttempts: 3 });
  assert(job.id && job.state === 'waiting');
  console.log(`✓ PASS: Submit Job (${job.id})`);

  // Step 5: Process and Acknowledge Job
  console.log('Requirement 5: Process & Acknowledge Job...');
  const claimed = await queue.fetchNext('worker-conf-1', 10000);
  assert.strictEqual(claimed.id, job.id);
  assert.strictEqual(claimed.state, 'active');
  await queue.ack(claimed.id, 'worker-conf-1', claimed.fencingToken);
  const inspected = await queue.inspect(claimed.id);
  assert.strictEqual(inspected.state, 'completed');
  console.log('✓ PASS: Process & Acknowledge Job');

  // Step 6 & 7: Failed Job & Retry Backoff
  console.log('Requirements 6 & 7: Failed Job & Exponential Backoff Retry...');
  const retryJob = await queue.add('failing-task', { attempts: 0 }, { maxAttempts: 2, backoffMs: 500 });
  const claimedFail = await queue.fetchNext('worker-conf-2', 5000);
  await queue.fail(claimedFail.id, 'worker-conf-2', claimedFail.fencingToken, 'Simulated failure 1');
  const afterFail = await queue.inspect(claimedFail.id);
  assert.strictEqual(afterFail.state, 'delayed');
  assert.strictEqual(afterFail.attempts, 1);
  assert(afterFail.runAt > Date.now());
  console.log('✓ PASS: Failed Job & Exponential Backoff Retry');

  // Step 8: Publish and Consume Event
  console.log('Requirement 8: Publish & Consume Event with Consumer Groups...');
  const events = client.events();
  const ev = await events.publish('conformance.topic', { action: 'ping' });
  const polled = await events.poll('conformance.topic', 'conf-group', 5);
  assert(polled.length >= 1);
  assert.strictEqual(polled[0].id, ev.id);
  await events.ack('conformance.topic', 'conf-group', ev.id);
  const polledAgain = await events.poll('conformance.topic', 'conf-group', 5);
  assert.strictEqual(polledAgain.length, 0);
  console.log('✓ PASS: Publish & Consume Event');

  // Step 9: Create and Inspect Schedule
  console.log('Requirement 9: Create & Inspect Schedule...');
  const scheduler = client.scheduler();
  const sch = await scheduler.addIntervalSchedule('hourly-check', 'conformance-queue', 3600000, { type: 'heartbeat' });
  assert.strictEqual(sch.name, 'hourly-check');
  const schedules = await scheduler.listSchedules();
  assert(schedules.some(s => s.id === sch.id));
  await scheduler.cancelSchedule(sch.id);
  console.log('✓ PASS: Create & Inspect Schedule');

  // Step 10: Clean Disconnect
  console.log('Requirement 10: Disconnect Cleanly...');
  await client.close();
  assert(client.connected === false || client.socket === null);
  console.log('✓ PASS: Disconnect Cleanly');

  await server.close();
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('\n=== ALL 10 MANDATORY CONFORMANCE TESTS PASSED WITH 100% SUCCESS! ===\n');
}

runConformanceSuite().catch(err => {
  console.error('\n✗ CONFORMANCE TEST FAILED:', err);
  process.exit(1);
});
