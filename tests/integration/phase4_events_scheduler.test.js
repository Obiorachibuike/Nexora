const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { NexoraServer } = require('../../server/src/server');
const { NexoraClient } = require('../../sdks/typescript/dist/client');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testEventsAndScheduler() {
  console.log('=== PHASE 3 & 4 INTEGRATION TEST: EVENTS, SCHEDULER & COMPACTION ===\n');

  const testDir = path.resolve(__dirname, '../../test-data-phase4');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const tcpPort = 6486;
  const httpPort = 6487;

  const server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: testDir,
  });
  await server.start();

  const client = new NexoraClient({ host: '127.0.0.1', port: tcpPort });
  await client.connect();

  console.log('--- TEST 1: EVENT MESSAGING & CONSUMER GROUPS ---');
  const events = client.events();

  // Publish 3 events
  const ev1 = await events.publish('orders.created', { orderId: 101, amount: 50.0 });
  const ev2 = await events.publish('orders.created', { orderId: 102, amount: 75.0 });
  const ev3 = await events.publish('orders.created', { orderId: 103, amount: 120.0 });

  assert.strictEqual(ev1.id, 1);
  assert.strictEqual(ev2.id, 2);
  assert.strictEqual(ev3.id, 3);
  console.log('✓ Published 3 events with sequential IDs (1, 2, 3)');

  // Poll as consumer group 'fraud-team'
  let batch = await events.poll('orders.created', 'fraud-team', 10);
  assert.strictEqual(batch.length, 3, 'Consumer group must receive all 3 events');
  console.log(`✓ Consumer group "fraud-team" polled ${batch.length} events`);

  // Acknowledge event 2
  await events.ack('orders.created', 'fraud-team', 2);
  console.log('✓ Acknowledged events up to ID 2');

  // Poll again - should only receive event 3
  batch = await events.poll('orders.created', 'fraud-team', 10);
  assert.strictEqual(batch.length, 1, 'Only unacknowledged events should be returned');
  assert.strictEqual(batch[0].id, 3);
  console.log('✓ Offset tracking verified: only event 3 returned on next poll');

  console.log('\n--- TEST 2: RECURRING SCHEDULER ---');
  const scheduler = client.scheduler();
  const queue = client.queue('cron-tasks');

  // Register schedule that runs every 300ms
  const sch = await scheduler.addIntervalSchedule(
    'periodic-sync',
    'cron-tasks',
    300,
    { syncTarget: 'inventory' },
    'Skip'
  );
  assert(sch.id !== undefined);
  console.log(`✓ Schedule registered: ${sch.name} (interval: 300ms)`);

  // List schedules
  const list = await scheduler.listSchedules();
  assert(list.length >= 1);
  console.log(`✓ Listed active schedules (${list.length} found)`);

  // Wait 700ms to allow scheduler tick to trigger jobs into the queue
  await sleep(700);

  // Claim triggered job from queue
  const scheduledJob = await queue.fetchNext('cron-worker-1', 5000);
  assert(scheduledJob !== null, 'Scheduler must automatically submit job into queue');
  assert.strictEqual(scheduledJob.name, 'periodic-sync');
  assert.strictEqual(scheduledJob.payload.syncTarget, 'inventory');
  await queue.ack(scheduledJob.id, 'cron-worker-1', scheduledJob.fencingToken);
  console.log(`✓ Worker claimed and acknowledged recurring scheduler job: ${scheduledJob.id}`);

  // Cancel schedule
  const cancelled = await scheduler.cancelSchedule(sch.id);
  assert.strictEqual(cancelled, true);
  console.log('✓ Cancelled schedule successfully');

  console.log('\n--- TEST 3: ONLINE LOG COMPACTION & RECOVERY ---');
  const store = client.store();

  // Write 30 temporary keys
  for (let i = 0; i < 30; i++) {
    await store.set(`temp:key:${i}`, `temp_value_${i}`);
  }
  // Delete 25 of them
  for (let i = 0; i < 25; i++) {
    await store.delete(`temp:key:${i}`);
  }
  // Store 5 permanent keys
  for (let i = 0; i < 5; i++) {
    await store.set(`perm:key:${i}`, `permanent_val_${i}`);
  }

  const preCompactSize = fs.statSync(path.join(testDir, 'segment_00000001.log')).size;
  console.log(`Segment size before compaction: ${preCompactSize} bytes`);

  // Trigger compaction
  const postCompactSize = await server.storage.compact();
  console.log(`Segment size after compaction: ${postCompactSize} bytes`);
  assert(postCompactSize < preCompactSize, 'Compaction must reduce segment file size by reclaiming deleted keys');

  // Verify all 5 permanent keys are still intact
  for (let i = 0; i < 5; i++) {
    const val = await store.get(`perm:key:${i}`);
    assert.strictEqual(val, `permanent_val_${i}`, `Key perm:key:${i} must survive compaction`);
  }
  console.log('✓ Verified active keys preserved after compaction');

  await client.close();
  await server.close();
  fs.rmSync(testDir, { recursive: true, force: true });

  console.log('\n=== ALL PHASE 3 & 4 INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

testEventsAndScheduler().catch((err) => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
