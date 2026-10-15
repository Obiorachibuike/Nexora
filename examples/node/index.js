const { NexoraClient } = require('../../sdks/typescript/dist/client');

async function main() {
  console.log('Connecting to Nexora Server from Node.js Example...');
  const client = new NexoraClient({ host: '127.0.0.1', port: 6380 });
  await client.connect();

  console.log('1. Setting Key-Value pair with 60s TTL...');
  const store = client.store();
  await store.set('customer:101', { name: 'Ada Lovelace', tier: 'enterprise' }, { ttlMs: 60000 });
  const customer = await store.get('customer:101');
  console.log('Retrieved customer:', customer);

  console.log('2. Adding high-priority background job...');
  const queue = client.queue('invoices');
  const job = await queue.add('generate-invoice', { invoiceId: 'inv_84920', total: 499.00 }, { priority: 15 });
  console.log('Job enqueued:', job.id);

  console.log('3. Registering worker loop...');
  const worker = await queue.process('generate-invoice', async (job) => {
    console.log(`Worker processing invoice ${job.payload.invoiceId} for $${job.payload.total}`);
  });

  setTimeout(async () => {
    worker.stop();
    await client.close();
    console.log('Example finished cleanly.');
  }, 1000);
}

main().catch(console.error);
