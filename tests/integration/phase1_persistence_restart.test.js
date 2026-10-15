const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { NexoraServer } = require('../../server/src/server');
const { NexoraClient } = require('../../sdks/typescript/dist/client');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTest() {
  console.log('=== PHASE 1 INTEGRATION TEST: PERSISTENCE & CRASH RECOVERY ===\n');

  const testDir = path.resolve(__dirname, '../../test-data-phase1');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const tcpPort = 6480;
  const httpPort = 6481;
  const apiKey = 'nexora_test_secret_key_889';

  console.log('Step 1: Starting Nexora Server instance 1...');
  let server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: testDir,
    apiKey,
    durability: 'fsync',
  });
  await server.start();
  console.log('✓ Nexora server instance 1 started.');

  console.log('Step 2: Connecting TypeScript SDK client with API key...');
  const client = new NexoraClient({
    host: '127.0.0.1',
    port: tcpPort,
    apiKey,
  });
  await client.connect();
  const pong = await client.ping();
  assert.strictEqual(pong, true, 'Server must respond to PING');
  console.log('✓ Client connected, authenticated, and verified ping.');

  console.log('Step 3: Performing Key-Value operations...');
  const store = client.store();

  // Set durable key
  await store.set('user:42', { name: 'Ada Lovelace', role: 'Mathematician' });
  console.log('✓ Stored user:42');

  // Set short TTL key
  await store.set('temp:session', { token: 'xyz999' }, { ttlMs: 600 });
  console.log('✓ Stored temp:session with 600ms TTL');

  // Atomic increment
  const inc1 = await store.incr('counter:hits', 1);
  const inc2 = await store.incr('counter:hits', 4);
  assert.strictEqual(inc2, 5, 'Atomic counter must reach 5');
  console.log(`✓ Atomic increment succeeded (counter:hits = ${inc2})`);

  // Verify immediate reads
  const u1 = await store.get('user:42');
  assert.strictEqual(u1.name, 'Ada Lovelace');
  assert.strictEqual(u1.role, 'Mathematician');
  const ttl1 = await store.ttl('user:42');
  assert.strictEqual(ttl1, -1, 'Durable key must have -1 TTL');
  console.log('✓ Verified immediate reads in instance 1.');

  console.log('Step 4: Shutting down Nexora server instance 1...');
  await client.close();
  await server.close();
  console.log('✓ Server instance 1 stopped cleanly.');

  // Verify log file exists on disk
  const logFile = path.join(testDir, 'segment_00000001.log');
  assert(fs.existsSync(logFile), 'Append-only segment log must exist');
  const stat = fs.statSync(logFile);
  console.log(`✓ Confirmed on-disk segment log: ${stat.size} bytes written.`);

  console.log('Step 5: Waiting 800ms for temp:session TTL to elapse offline...');
  await sleep(800);

  console.log('Step 6: Starting Nexora Server instance 2 on the SAME data directory...');
  server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: testDir,
    apiKey,
    durability: 'fsync',
  });
  await server.start();
  console.log('✓ Nexora server instance 2 started (recovered from log).');

  console.log('Step 7: Connecting new client to instance 2...');
  const client2 = new NexoraClient({
    host: '127.0.0.1',
    port: tcpPort,
    apiKey,
  });
  await client2.connect();
  const store2 = client2.store();

  console.log('Step 8: Verifying data durability and expiration across restart...');
  const recoveredUser = await store2.get('user:42');
  assert(recoveredUser !== null, 'Durable key user:42 MUST survive restart');
  assert.strictEqual(recoveredUser.name, 'Ada Lovelace');
  assert.strictEqual(recoveredUser.role, 'Mathematician');
  console.log('✓ user:42 survived restart: ' + JSON.stringify(recoveredUser));

  const expiredSession = await store2.get('temp:session');
  assert.strictEqual(expiredSession, null, 'Expired key temp:session must be null after restart');
  console.log('✓ temp:session correctly expired during offline restart period');

  const recoveredCounter = await store2.get('counter:hits');
  assert.strictEqual(String(recoveredCounter), '5', 'counter:hits MUST survive restart with value 5');
  console.log('✓ counter:hits survived restart with value 5');

  // Verify new writes work on instance 2
  await store2.set('system:status', 'operational');
  const status = await store2.get('system:status');
  assert.strictEqual(status, 'operational');
  console.log('✓ Post-restart write succeeded');

  await client2.close();
  await server.close();

  // Clean up
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('\n=== ALL PHASE 1 PERSISTENCE AND RESTART TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
