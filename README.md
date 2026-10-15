# Nexora

<div align="center">

**Powering the next generation of applications.**

*An independent infrastructure engine combining durable background job processing, key-value storage, caching, event messaging, scheduling, and worker coordination in one single server.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Protocol: NBP/1.0](https://img.shields.io/badge/Protocol-NBP%2F1.0-6366F1.svg)](protocol/SPECIFICATION.md)
[![SDKs: 20 Languages](https://img.shields.io/badge/Official%20SDKs-20%20Languages-10B981.svg)](#official-sdks)
[![Durability: Append--Only](https://img.shields.io/badge/Storage-Append--Only%20Log-22D3EE.svg)](docs/storage.md)

</div>

---

## 1. Executive Summary

Nexora is a production-oriented, independent infrastructure engine that unifies background queues, persistent storage, high-throughput caching, event pub/sub, and scheduling into a single server.

It is **NOT** a wrapper around Redis, BullMQ, Celery, RocksDB, or SQLite. Nexora implements its own custom append-only storage engine with CRC32 record framing, its own length-prefixed binary wire protocol over TCP, and its own multi-state durable queue machine.

Applications interact with Nexora through official, native SDKs across **20 programming languages** speaking the exact same protocol.

---

## 2. Core Capabilities

1. **Persistent Key-Value Storage:** Append-only log engine (AOF) with 35-byte binary record framing, monotonic sequence numbers, and IEEE 802.3 CRC32 checksums.
2. **Crash Recovery & Torn-Write Detection:** Automated recovery scanner that detects partial/corrupted log tails and cleanly truncates them upon restart.
3. **High-Performance In-Memory Cache:** Sub-millisecond response caching with millisecond-precision TTL expiration, atomic CAS, and LRU eviction under memory bounds.
4. **Durable Job Queues:** 7-state lifecycle machine (`Waiting`, `Delayed`, `Active`, `Completed`, `Failed`, `Cancelled`, `DeadLettered`) with atomic claiming and priority scheduling.
5. **Worker Coordination & Leases:** Persistent worker leases guarded by monotonic fencing tokens to prevent stale & zombie workers from committing invalid state transitions.
6. **Automatic Retries & Exponential Backoff:** Configurable retry policies with exponential backoff, jitter, and automated Dead-Letter Queue (DLQ) routing.
7. **Event Pub/Sub Broker:** Named topics, consumer groups, consumer acknowledgments, and at-least-once delivery semantics.
8. **Recurring Job Scheduler:** Persistent interval and cron schedules with offline misfire handling (`Skip` vs `FireOnce`) that survive server reboots.
9. **Binary Client Protocol (NBP/1.0):** 24-byte multiplexed TCP framing with correlation IDs, error status codes, and CRC16 header verification.
10. **HTTP Management API & CLI:** REST health/metrics endpoints on port 6381, Prometheus metric scraping, and command-line administration tools.
11. **Official Website & Documentation Portal:** Production Next.js App Router website in `website/` with 50+ prerendered pages, instant search, and complete guides for all 20 SDKs.

---

## 3. Repository Architecture

```text
nexora/
├── Cargo.toml               # Rust workspace manifest (14 crates)
├── rust-toolchain.toml      # Toolchain specifications
├── crates/                  # Core Rust infrastructure crates
│   ├── nexora-core/         # Fundamental primitives, errors, and configuration
│   ├── nexora-protocol/     # NBP/1.0 binary wire framing and codecs
│   ├── nexora-storage/      # Append-only log engine (AOF), CRC32, recovery scanner
│   ├── nexora-cache/        # Hot memory cache with LRU eviction
│   ├── nexora-queue/        # 7-state persistent queue machine & leases
│   ├── nexora-events/       # Topic broker & consumer group offsets
│   ├── nexora-scheduler/    # Cron & interval scheduler with misfire policies
│   ├── nexora-workers/      # Worker registry & heartbeat coordination
│   ├── nexora-auth/         # Constant-time API key verification
│   ├── nexora-metrics/      # Operational metrics collector
│   ├── nexora-admin/        # Axum HTTP management router
│   ├── nexora-server/       # Unified server binary combining TCP & HTTP
│   ├── nexora-cli/          # Command-line administrative tool
│   └── nexora-testkit/      # Conformance test vectors & mock harness
├── protocol/                # Wire specifications and test vectors
│   ├── SPECIFICATION.md     # Formal 24-byte NBP/1.0 protocol specification
│   ├── VERSIONING.md        # SemVer & compatibility rules
│   └── test-vectors/        # Standard binary test vectors
├── server/                  # Reference server runtime implementation
│   └── src/                 # Protocol, storage, queue, auth & HTTP modules
├── bin/                     # Server & CLI executables
│   ├── nexora-server.js     # Server entry point
│   └── nexora.js            # CLI administration binary
├── sdks/                    # Official native SDKs for 20 languages
│   ├── typescript/          # @nexora/client (npm)
│   ├── javascript/          # nexora (npm)
│   ├── python/              # nexora (PyPI)
│   ├── go/                  # github.com/Obiorachibuike/Nexora/sdks/go
│   ├── rust/                # nexora (crates.io)
│   ├── cpp/                 # nexora-cpp (CMake)
│   ├── c/                   # libnexora (pkg-config)
│   ├── java/                # dev.nexora:nexora-client (Maven)
│   ├── csharp/              # Nexora.Client (NuGet)
│   ├── php/                 # nexora/nexora-client (Packagist)
│   ├── ruby/                # nexora (RubyGems)
│   ├── kotlin/              # dev.nexora:nexora-kotlin (Maven)
│   ├── swift/               # Nexora (Swift Package Manager)
│   ├── dart/                # nexora (pub.dev)
│   ├── elixir/              # nexora (Hex.pm)
│   ├── scala/               # dev.nexora::nexora-client (Maven)
│   ├── r/                   # nexora (CRAN)
│   ├── julia/               # Nexora (General Registry)
│   ├── lua/                 # nexora (LuaRocks)
│   └── perl/                # Nexora::Client (CPAN)
├── website/                 # Official Next.js website & documentation portal
├── tests/                   # Integration, recovery, and conformance tests
└── examples/                # Runnable integration examples
```

---

## 4. Quickstart Guide

### 4.1 Launching the Nexora Server

Start the standalone Nexora engine:

```bash
# Start server on TCP port 6380 and HTTP management port 6381
./bin/nexora-server.js --port 6380 --http-port 6381 --data-dir ./data
```

### 4.2 Diagnostic Check

Verify server reachability and diagnostics using the CLI:

```bash
./bin/nexora.js doctor
./bin/nexora.js status
```

### 4.3 Running the Integration Tests

```bash
# Test 1: Storage engine persistence & offline restart recovery
node tests/integration/phase1_persistence_restart.test.js

# Test 2: Power-loss simulation & torn-write tail truncation
node tests/recovery/torn_write_recovery.test.js

# Test 3: Multi-worker atomic queue claims, leases, and backoff
node tests/integration/phase2_queue_workers.test.js
```

---

## 5. Official Language SDK Ecosystem

| # | Language | Status | Package Name | Registry | Min Version |
|---|---|---|---|---|---|
| 1 | **TypeScript** | Stable | `@nexora/client` | npm | Node.js 18+ / TS 5.0+ |
| 2 | **JavaScript** | Stable | `nexora` | npm | Node.js 18+ |
| 3 | **Python** | Stable | `nexora` | PyPI | Python 3.8+ |
| 4 | **Go** | Beta | `github.com/.../sdks/go` | Go Modules | Go 1.21+ |
| 5 | **Rust** | Beta | `nexora` | crates.io | Rust 1.74+ |
| 6 | **C++** | Beta | `nexora-cpp` | CMake / Conan | C++17 |
| 7 | **C** | Beta | `libnexora` | pkg-config | C99 |
| 8 | **Java** | Beta | `dev.nexora:nexora-client` | Maven Central | Java 17+ |
| 9 | **C#** | Beta | `Nexora.Client` | NuGet | .NET 8.0+ |
| 10 | **PHP** | Beta | `nexora/nexora-client` | Packagist | PHP 8.1+ |
| 11 | **Ruby** | Beta | `nexora` | RubyGems | Ruby 3.0+ |
| 12 | **Kotlin** | Beta | `dev.nexora:nexora-kotlin` | Maven Central | Kotlin 1.9+ |
| 13 | **Swift** | Beta | `Nexora` | SwiftPM | Swift 5.9+ |
| 14 | **Dart** | Beta | `nexora` | pub.dev | Dart 3.0+ |
| 15 | **Elixir** | Beta | `nexora` | Hex.pm | Elixir 1.14+ |
| 16 | **Scala** | Beta | `dev.nexora::nexora-client` | Maven Central | Scala 3.3+ |
| 17 | **R** | Beta | `nexora` | CRAN | R 4.0+ |
| 18 | **Julia** | Beta | `Nexora` | General Registry | Julia 1.9+ |
| 19 | **Lua** | Beta | `nexora` | LuaRocks | Lua 5.1+ |
| 20 | **Perl** | Beta | `Nexora::Client` | CPAN | Perl 5.30+ |

---

## 6. Official Website & Documentation Portal

The documentation and marketing website is built with **Next.js 14 App Router**, **Tailwind CSS**, and **Lucide icons** in `website/`:

```bash
cd website
npm install
npm run build
npm test
npm start
```

Features include:
- Prerendered documentation for all core concepts, wire protocol specs, and storage models.
- Dedicated language documentation pages for all 20 SDKs at `/docs/sdks/[slug]`.
- Interactive multi-language code switcher with copy-to-clipboard functionality.
- Real client-side search covering documentation, SDKs, and error codes with `Cmd+K` / `Ctrl+K`.

---

## 7. License

Dual-licensed under the **MIT License** and **Apache License 2.0**. See [LICENSE](LICENSE) for details.
