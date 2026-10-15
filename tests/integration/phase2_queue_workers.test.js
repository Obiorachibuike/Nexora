const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { NexoraServer } = require('../../server/src/server');
const { NexoraClient } = require('../../sdks/typescript/dist/client');

async function testQueues() {
  console.log('=== PHASE 2 INTEGRATION TEST: QUEUES, WORKERS & LEASES ===\n');

  const testDir = path.resolve(__dirname, '../../test-data-queues');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const tcpPort = 6484;
  const httpPort = 6485;

  const server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: testDir,
  });
  await server.start();

  const client = new NexoraClient({ host: '127.0.0.1', port: tcpPort });
  await client.connect();
  const queue = client.queue('emails');

  console.log('Step 1: Adding jobs with different priorities...');
  const lowJob = await queue.add('welcome-email', { email: 'low@test.dev' }, { priority: 1 });
  const highJob = await queue.add('critical-alert', { alert: 'server down' }, { priority: 20 });
  const normalJob = await queue.add('weekly-digest', { email: 'user@test.dev' }, { priority: 5 });

  console.log('✓ Submitted 3 jobs (low: 1, normal: 5, high: 20)');

  console.log('Step 2: Fetching next job - verify high-priority job is claimed first...');
  const claimed1 = await queue.fetchNext('worker-A', 5000);
  assert(claimed1 !== null, 'Worker must claim a job');
  assert.strictEqual(claimed1.id, highJob.id, 'High priority job must be claimed first');
  assert.strictEqual(claimed1.leaseOwner, 'worker-A');
  console.log(`✓ Worker-A claimed high priority job: ${claimed1.id} (${claimed1.name})`);

  console.log('Step 3: Worker-B fetches next job - verify normal priority job is claimed next...');
  const claimed2 = await queue.fetchNext('worker-B', 5000);
  assert(claimed2 !== null, 'Worker-B must claim normal job');
  assert.strictEqual(claimed2.id, normalJob.id, 'Normal priority job must be claimed before low');
  console.log(`✓ Worker-B claimed normal priority job: ${claimed2.id}`);

  console.log('Step 4: Worker-A acknowledges job completion...');
  await queue.ack(claimed1.id, 'worker-A', claimed1.fencingToken);
  const inspected1 = await queue.inspect(claimed1.id);
  assert.strictEqual(inspected1.state, 'completed');
  console.log('✓ High priority job marked completed');

  console.log('Step 5: Testing failure reporting and retry with exponential backoff...');
  // Worker-B fails job with error
  await queue.fail(claimed2.id, 'worker-B', claimed2.fencingToken, 'SMTP connection timeout');
  const inspected2 = await queue.inspect(claimed2.id);
  assert.strictEqual(inspected2.state, 'delayed', 'Failed job with remaining attempts must be delayed for retry');
  assert.strictEqual(inspected2.attempts, 1);
  assert(inspected2.runAt > Date.now(), 'runAt must be in the future');
  console.log(`✓ Job retry scheduled in future (runAt: ${new Date(inspected2.runAt).toISOString()})`);

  await client.close();
  await server.close();
  fs.rmSync(testDir, { recursive: true, force: true });

  console.log('\n=== ALL PHASE 2 QUEUE & WORKER TESTS PASSED SUCCESSFULLY! ===');
}

testQueues().catch((err) => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
