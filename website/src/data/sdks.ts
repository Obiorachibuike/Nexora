export interface SdkMeta {
  name: string;
  slug: string;
  category: 'primary' | 'backend' | 'systems' | 'modern' | 'scientific';
  version: string;
  status: 'Stable' | 'Beta';
  packageManager: string;
  installCmd: string;
  repoPath: string;
  description: string;
  quickstartCode: string;
  features: string[];
}

export const SDKS: SdkMeta[] = [
  {
    name: 'TypeScript',
    slug: 'typescript',
    category: 'primary',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'npm',
    installCmd: 'npm install @nexora/client',
    repoPath: 'sdks/typescript',
    description: 'Official TypeScript client for Nexora with full type definitions, Promise-based async API, worker pools, and automatic reconnection.',
    quickstartCode: `import { NexoraClient } from '@nexora/client';

const client = new NexoraClient({
  host: '127.0.0.1',
  port: 6380,
  apiKey: 'nexora_live_secret',
});

await client.connect();

// Key-Value with TTL
await client.store.set('user:session', { id: 42, role: 'admin' }, { ttlMs: 3600000 });
const session = await client.store.get('user:session');

// Durable Queue
await client.queue.add('transcode', { videoId: 'abc-123' }, { priority: 10 });

// Atomic Worker Claim & Ack
const job = await client.queue.fetchJob('transcode', 'worker-1', 30000);
if (job) {
  console.log('Processing:', job.payload);
  await client.queue.ack(job.id, 'worker-1', job.leaseToken);
}

await client.disconnect();`,
    features: ['Strict TypeScript typings', 'Non-blocking I/O', 'Worker leases with fencing tokens', 'AOF durability support'],
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    category: 'primary',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'npm',
    installCmd: 'npm install nexora',
    repoPath: 'sdks/javascript',
    description: 'Zero-overhead CommonJS and ES Module client for Node.js runtimes.',
    quickstartCode: `const { NexoraClient } = require('nexora');

const client = new NexoraClient({ host: '127.0.0.1', port: 6380, apiKey: 'secret' });
await client.connect();
await client.store.set('site:views', 100);
await client.store.incr('site:views');
await client.disconnect();`,
    features: ['CommonJS & ESM support', 'Promise API', 'Lightweight runtime'],
  },
  {
    name: 'Python',
    slug: 'python',
    category: 'primary',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'pip',
    installCmd: 'pip install nexora',
    repoPath: 'sdks/python',
    description: 'Python client supporting sync and asyncio with automatic binary NBP framing, connection pooling, and worker wrappers.',
    quickstartCode: `from nexora import NexoraClient

client = NexoraClient(host="127.0.0.1", port=6380, api_key="secret")
client.connect()

# Key-Value
client.store.set("cache:user:1", {"name": "Alice"}, ttl_ms=60000)
user = client.store.get("cache:user:1")

# Background Jobs
client.queue.add("email", {"to": "alice@example.com"}, priority=5)
job = client.queue.fetch_job("email", worker_id="py-worker-1", lease_ms=15000)
if job:
    client.queue.ack(job["id"], worker_id="py-worker-1", lease_token=job["lease_token"])

client.disconnect()`,
    features: ['Sync & Async API', 'Type hints', 'Fast binary protocol framing', 'Native dict/json serialization'],
  },
  {
    name: 'Java',
    slug: 'java',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'Maven / Gradle',
    installCmd: '<dependency><groupId>dev.nexora</groupId><artifactId>nexora-client</artifactId><version>1.0.0</version></dependency>',
    repoPath: 'sdks/java',
    description: 'Enterprise-grade Java client with connection pooling, Netty-based async I/O, and thread-safe worker execution.',
    quickstartCode: `import dev.nexora.NexoraClient;

NexoraClient client = NexoraClient.builder()
    .host("127.0.0.1")
    .port(6380)
    .apiKey("secret")
    .build();

client.connect();
client.set("user:account", "active");
String val = client.get("user:account");
client.disconnect();`,
    features: ['Thread-safe', 'Netty event loops', 'Fluent builder API', 'Virtual threads compatible'],
  },
  {
    name: 'C# / .NET',
    slug: 'csharp',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'NuGet',
    installCmd: 'dotnet add package Nexora.Client',
    repoPath: 'sdks/csharp',
    description: 'High-performance .NET client leveraging System.Threading.Channels and ValueTask for zero-allocation async pipelines.',
    quickstartCode: `using Nexora;

await using var client = new NexoraClient("127.0.0.1", 6380, "secret");
await client.ConnectAsync();
await client.SetAsync("balance:usd", 5000);
var balance = await client.GetAsync("balance:usd");`,
    features: ['ValueTask async/await', 'Span<T> parsing', 'Generic serialization', 'ASP.NET Core DI ready'],
  },
  {
    name: 'Go',
    slug: 'go',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'go get',
    installCmd: 'go get github.com/nexora-dev/nexora-go',
    repoPath: 'sdks/go',
    description: 'Idiomatic Go client with context cancellation, goroutine-safe connection multiplexing, and worker interfaces.',
    quickstartCode: `package main

import (
    "context"
    "fmt"
    "github.com/nexora-dev/nexora-go"
)

func main() {
    ctx := context.Background()
    client, _ := nexora.NewClient("127.0.0.1:6380", "secret")
    _ = client.Connect(ctx)
    defer client.Close()

    _ = client.Store.Set(ctx, "session:token", "xyz", 3600000)
    val, _ := client.Store.Get(ctx, "session:token")
    fmt.Println("Session:", val)
}`,
    features: ['Goroutine-safe', 'Context-aware timeouts', 'Zero external runtime dependencies'],
  },
  {
    name: 'PHP',
    slug: 'php',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'Composer',
    installCmd: 'composer require nexora/nexora-php',
    repoPath: 'sdks/php',
    description: 'PHP client supporting synchronous FPM requests and long-running CLI queue worker daemons with Swoole/Fiber compatibility.',
    quickstartCode: `use Nexora\\NexoraClient;

$client = new NexoraClient('127.0.0.1', 6380, 'secret');
$client->connect();
$client->set('cache:profile', ['id' => 10, 'tier' => 'gold'], 300000);
$profile = $client->get('cache:profile');
$client->disconnect();`,
    features: ['PHP 8.1+ typed syntax', 'FPM persistent connections', 'Laravel & Symfony integration helpers'],
  },
  {
    name: 'Ruby',
    slug: 'ruby',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'gem',
    installCmd: 'gem install nexora',
    repoPath: 'sdks/ruby',
    description: 'Ruby client built for Rails and Sidekiq drop-in migrations with fiber concurrency support.',
    quickstartCode: `require 'nexora'

client = Nexora::Client.new(host: '127.0.0.1', port: 6380, api_key: 'secret')
client.connect
client.set('rails:cache:key', { version: 1 })
puts client.get('rails:cache:key')
client.disconnect`,
    features: ['Ruby 3.x Ractor & Fiber safe', 'Rails ActiveJob adapter ready', 'Connection pool support'],
  },
  {
    name: 'Rust',
    slug: 'rust',
    category: 'systems',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'Cargo',
    installCmd: 'cargo add nexora',
    repoPath: 'sdks/rust',
    description: 'Blazing fast async Rust client powered by Tokio, zero-copy buffer parsing, and strict memory safety guarantees.',
    quickstartCode: `use nexora::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = Client::connect("127.0.0.1:6380", "secret").await?;
    client.set("telemetry:active", "true").await?;
    let val = client.get("telemetry:active").await?;
    println!("Val: {:?}", val);
    Ok(())
}`,
    features: ['Tokio async runtime', 'Zero-copy frame parsing', 'Compile-time type guarantees'],
  },
  {
    name: 'C++',
    slug: 'cpp',
    category: 'systems',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'CMake / vcpkg',
    installCmd: 'find_package(nexora CONFIG REQUIRED)',
    repoPath: 'sdks/cpp',
    description: 'Modern C++20 client library with RAII resource lifetime management and zero-copy binary socket buffers.',
    quickstartCode: `#include <nexora/client.hpp>
#include <iostream>

int main() {
    nexora::Client client("127.0.0.1", 6380, "secret");
    if (client.connect()) {
        client.set("status", "operational");
        std::cout << "Status: " << client.get("status").value_or("") << std::endl;
        client.disconnect();
    }
    return 0;
}`,
    features: ['C++20 std::expected and spans', 'Zero external dependencies', 'CMake integration target'],
  },
  {
    name: 'C',
    slug: 'c',
    category: 'systems',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'CMake / Make',
    installCmd: 'make && sudo make install',
    repoPath: 'sdks/c',
    description: 'ANSI C (C99) client with zero dependencies, raw POSIX socket framing, and clean malloc/free lifetime semantics.',
    quickstartCode: `#include <nexora.h>
#include <stdio.h>

int main(void) {
    nexora_client_t* client = nexora_client_new("127.0.0.1", 6380, "secret");
    if (nexora_client_connect(client) == 0) {
        nexora_set(client, "engine:status", "online", 0);
        char* val = nexora_get(client, "engine:status");
        if (val) {
            printf("Value: %s\\n", val);
            free(val);
        }
        nexora_client_disconnect(client);
    }
    nexora_client_free(client);
    return 0;
}`,
    features: ['POSIX compliant C99', 'No external dependencies', 'Clean error codes and memory contracts'],
  },
  {
    name: 'Kotlin',
    slug: 'kotlin',
    category: 'modern',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'Gradle',
    installCmd: 'implementation("dev.nexora:nexora-kotlin:1.0.0")',
    repoPath: 'sdks/kotlin',
    description: 'First-class Kotlin client with Coroutines and Flow APIs for reactive event consumption and job processing.',
    quickstartCode: `import dev.nexora.NexoraClient
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val client = NexoraClient("127.0.0.1", 6380, "secret")
    client.connect()
    client.set("user:token", "abc-jwt")
    println(client.get("user:token"))
    client.disconnect()
}`,
    features: ['Coroutines & Flow support', 'Kotlin multiplatform ready', 'Idiomatic extension functions'],
  },
  {
    name: 'Swift',
    slug: 'swift',
    category: 'modern',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'SwiftPM',
    installCmd: '.package(url: "https://github.com/nexora-dev/nexora-swift.git", from: "1.0.0")',
    repoPath: 'sdks/swift',
    description: 'Async/await Swift client designed for server-side Swift (Vapor) and iOS/macOS systems programming.',
    quickstartCode: `import Nexora

let client = NexoraClient(host: "127.0.0.1", port: 6380, apiKey: "secret")
try await client.connect()
try await client.set("device:sync", value: "ok")
let status = try await client.get("device:sync")
print("Status: \\(status ?? "")")
await client.disconnect()`,
    features: ['Swift Concurrency (async/await)', 'SwiftNIO integration', 'Cross-platform Linux & Darwin'],
  },
  {
    name: 'Dart',
    slug: 'dart',
    category: 'modern',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'pub',
    installCmd: 'dart pub add nexora',
    repoPath: 'sdks/dart',
    description: 'Dart client with Stream-based event pipelines and full support for Dart Frog, server-side Dart, and Flutter.',
    quickstartCode: `import 'package:nexora/nexora.dart';

void main() async {
  final client = NexoraClient(host: '127.0.0.1', port: 6380, apiKey: 'secret');
  await client.connect();
  await client.set('app:state', 'ready');
  print(await client.get('app:state'));
  await client.disconnect();
}`,
    features: ['Streams API', 'Type-safe JSON serialization', 'Server & Flutter compatible'],
  },
  {
    name: 'Elixir',
    slug: 'elixir',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'Hex',
    installCmd: '{:nexora, "~> 1.0.0"}',
    repoPath: 'sdks/elixir',
    description: 'OTP-compliant GenServer client for Elixir and Phoenix with supervision tree integration and distributed telemetry.',
    quickstartCode: `{:ok, pid} = Nexora.start_link(host: "127.0.0.1", port: 6380, api_key: "secret")
Nexora.set(pid, "session:id", "987")
{:ok, val} = Nexora.get(pid, "session:id")
IO.puts("Session: #{val}")`,
    features: ['OTP GenServer & Supervisor', 'Poolboy integration', 'Telemetry events'],
  },
  {
    name: 'Scala',
    slug: 'scala',
    category: 'backend',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'sbt',
    installCmd: 'libraryDependencies += "dev.nexora" %% "nexora-scala" % "1.0.0"',
    repoPath: 'sdks/scala',
    description: 'Functional Scala client with ZIO, Cats Effect, and Future compatibility for type-level distributed systems.',
    quickstartCode: `import dev.nexora.NexoraClient

val client = new NexoraClient("127.0.0.1", 6380, "secret")
client.connect()
client.set("scala:key", "value")
println(client.get("scala:key"))
client.disconnect()`,
    features: ['Cats Effect & ZIO support', 'Pure functional error handling', 'Akka / Pekko compatible'],
  },
  {
    name: 'R',
    slug: 'r',
    category: 'scientific',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'CRAN / devtools',
    installCmd: 'devtools::install_github("nexora-dev/nexora-r")',
    repoPath: 'sdks/r',
    description: 'R client for data pipelines, distributed model training job queuing, and persistent experiment state caching.',
    quickstartCode: `library(nexora)

client <- nexora_connect("127.0.0.1", 6380, "secret")
nexora_set(client, "model:metric", "0.985")
metric <- nexora_get(client, "model:metric")
print(metric)
nexora_disconnect(client)`,
    features: ['Data.frame caching integration', 'RStudio and Shiny ready', 'Job queueing for long simulations'],
  },
  {
    name: 'Julia',
    slug: 'julia',
    category: 'scientific',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'Pkg',
    installCmd: 'using Pkg; Pkg.add("Nexora")',
    repoPath: 'sdks/julia',
    description: 'High-performance scientific computing client for Julia with native Sockets and multi-threaded worker dispatch.',
    quickstartCode: `using Nexora

client = NexoraClient("127.0.0.1", 6380, "secret")
connect!(client)
set!(client, "sim:state", "running")
println(get(client, "sim:state"))
disconnect!(client)`,
    features: ['Multi-threaded dispatch', 'High throughput matrix cache support', 'Zero-overhead socket I/O'],
  },
  {
    name: 'Lua',
    slug: 'lua',
    category: 'systems',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'LuaRocks',
    installCmd: 'luarocks install nexora',
    repoPath: 'sdks/lua',
    description: 'Lightweight client for OpenResty, Nginx lua modules, Tarantool, and embedded game engine pipelines.',
    quickstartCode: `local Nexora = require("nexora")

local client = Nexora.new("127.0.0.1", 6380, "secret")
client:connect()
client:set("route:cached", "true")
print(client:get("route:cached"))
client:disconnect()`,
    features: ['OpenResty cosocket support', 'Zero C dependencies', 'Embeddable in Redis / Nginx / Envoy'],
  },
  {
    name: 'Perl',
    slug: 'perl',
    category: 'systems',
    version: '1.0.0',
    status: 'Stable',
    packageManager: 'CPAN',
    installCmd: 'cpanm Nexora::Client',
    repoPath: 'sdks/perl',
    description: 'Perl 5 client with IO::Socket::INET support for enterprise systems integration and legacy job queue migration.',
    quickstartCode: `use strict;
use warnings;
use Nexora::Client;

my $client = Nexora::Client->new(host => '127.0.0.1', port => 6380, api_key => 'secret');
$client->connect();
$client->set('perl:legacy', 'active');
print $client->get('perl:legacy') . "\n";
$client->disconnect();`,
    features: ['CPAN compliant', 'Mojolicious & Catalyst integration', 'Safe signal and lease handling'],
  },
];
