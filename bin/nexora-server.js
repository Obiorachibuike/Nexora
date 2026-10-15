#!/usr/bin/env node
const path = require('path');
const { NexoraServer } = require('../server/src/server');

const args = process.argv.slice(2);
let tcpPort = 6380;
let httpPort = 6381;
let bindAddr = '127.0.0.1';
let dataDir = path.resolve(process.cwd(), 'data');
let apiKey = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    tcpPort = parseInt(args[++i], 10);
  } else if (args[i] === '--http-port') {
    httpPort = parseInt(args[++i], 10);
  } else if (args[i] === '--bind' || args[i] === '-b') {
    bindAddr = args[++i];
  } else if (args[i] === '--data-dir') {
    dataDir = path.resolve(args[++i]);
  } else if (args[i] === '--api-key') {
    apiKey = args[++i];
  }
}

console.log(`Starting Nexora Infrastructure Engine v0.1.0...`);
console.log(`Binding TCP protocol on ${bindAddr}:${tcpPort}`);
console.log(`Binding HTTP management on ${bindAddr}:${httpPort}`);
console.log(`Storage data directory: ${dataDir}`);

const server = new NexoraServer({
  bindAddr,
  tcpPort,
  httpPort,
  dataDir,
  apiKey,
});

server.start().then(() => {
  console.log(`Nexora engine ready to accept connections.`);
}).catch((err) => {
  console.error(`Fatal startup error:`, err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log(`\nGracefully shutting down Nexora...`);
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(`\nGracefully shutting down Nexora...`);
  await server.close();
  process.exit(0);
});
