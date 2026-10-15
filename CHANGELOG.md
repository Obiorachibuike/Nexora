# Changelog

All notable changes to Nexora are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-13

### Added
- **Core Engine & Architecture:** Complete independent infrastructure platform combining persistent KV storage, high-performance cache, background job queues, events, and scheduling.
- **Append-Only Storage Engine (AOF):** Custom log engine with CRC32 record framing, segment rotation, monotonic sequence numbers, torn-write recovery, and configurable sync policies (`fsync`, `everysec`, `none`).
- **Binary Wire Protocol (NBP/1.0):** 22-byte framed protocol with correlation IDs, error codes, authentication handshakes, and binary/JSON payload negotiation over TCP.
- **Queue State Machine:** Full state transitions (`Waiting`, `Delayed`, `Active`, `Completed`, `Failed`, `Cancelled`, `Dead-lettered`) with atomic claiming, worker leases, heartbeats, exponential backoff, and dead-letter routing.
- **HTTP Management & Admin API:** Axum REST endpoints for `/health`, `/metrics`, `/api/v1/stats`, `/api/v1/queues`, `/api/v1/jobs`, `/api/v1/storage`.
- **Command-Line Interface (`nexora`):** Server management, health checks, storage diagnostics, queue inspection, and job actions.
- **20 Native SDKs:** Comprehensive client libraries across TypeScript, JavaScript, Python, Java, C#, Go, PHP, Ruby, Rust, C++, C, Kotlin, Swift, Dart, Elixir, Scala, R, Julia, Lua, Perl.
- **Official Documentation Portal & Website:** Next.js dark-first developer platform with comprehensive guides, architecture diagrams, use-case analyses, search, and live runnable examples.
