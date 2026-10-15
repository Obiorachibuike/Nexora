const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { NexoraServer } = require('../../server/src/server');
const { NexoraClient } = require('../../sdks/typescript/dist/client');

async function testTornWrite() {
  console.log('=== TORN-WRITE & CORRUPTION RECOVERY TEST ===\n');

  const testDir = path.resolve(__dirname, '../../test-data-recovery');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const tcpPort = 6482;
  const httpPort = 6483;

  console.log('Step 1: Starting server and writing valid records...');
  let server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: testDir,
    durability: 'fsync',
  });
  await server.start();

  const client = new NexoraClient({ host: '127.0.0.1', port: tcpPort });
  await client.connect();
  const store = client.store();

  await store.set('key1', 'value1');
  await store.set('key2', 'value2');
  await client.close();
  await server.close();

  const logFile = path.join(testDir, 'segment_00000001.log');
  const validSize = fs.statSync(logFile).size;
  console.log(`✓ Stored key1 and key2 (${validSize} bytes)`);

  console.log('Step 2: Simulating power loss by appending partial torn-write to log file...');
  // Append torn record (e.g. 12 random bytes simulating incomplete crash write)
  const tornBytes = Buffer.from([0xAA, 0x55, 0x01, 0x00, 0x00, 0x00, 0x99, 0x88, 0x77]);
  fs.appendFileSync(logFile, tornBytes);
  const corruptedSize = fs.statSync(logFile).size;
  assert.strictEqual(corruptedSize, validSize + tornBytes.length);
  console.log(`✓ Corrupted log tail with 9 incomplete bytes (size: ${corruptedSize} bytes)`);

  console.log('Step 3: Restarting server - recovery scanner should truncate torn tail...');
  server = new NexoraServer({
    bindAddr: '127.0.0.1',
    tcpPort,
    httpPort,
    dataDir: testDir,
    durability: 'fsync',
  });
  await server.start();

  const client2 = new NexoraClient({ host: '127.0.0.1', port: tcpPort });
  await client2.connect();
  const store2 = client2.store();

  const v1 = await store2.get('key1');
  const v2 = await store2.get('key2');
  assert.strictEqual(v1, 'value1', 'key1 must be recovered intact');
  assert.strictEqual(v2, 'value2', 'key2 must be recovered intact');
  console.log('✓ Successfully recovered key1 and key2 intact!');

  // Check file size was truncated back to valid size
  const postRecoverySize = fs.statSync(logFile).size;
  assert.strictEqual(postRecoverySize, validSize, 'Torn tail must be truncated back to last valid offset');
  console.log(`✓ Verified segment log truncated back to valid size: ${postRecoverySize} bytes`);

  // Write new key
  await store2.set('key3', 'value3');
  const v3 = await store2.get('key3');
  assert.strictEqual(v3, 'value3', 'New write key3 must succeed');
  console.log('✓ Post-recovery write succeeded');

  await client2.close();
  await server.close();
  fs.rmSync(testDir, { recursive: true, force: true });

  console.log('\n=== TORN-WRITE RECOVERY TEST PASSED SUCCESSFULLY! ===');
}

testTornWrite().catch((err) => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
