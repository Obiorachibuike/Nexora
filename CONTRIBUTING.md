# Contributing to Nexora

Thank you for your interest in contributing to Nexora! Nexora is an independent infrastructure engine designed to unify background queues, key-value storage, caching, event messaging, and scheduling into one single server.

## Architectural Principles

1. **Independent Engine:** Nexora is NOT a wrapper around Redis, BullMQ, RocksDB, or SQLite. All storage, protocol, and queue algorithms are native to Nexora.
2. **Durability First:** Data correctness and recovery guarantees come before speculative optimizations.
3. **Multi-Language Parity:** All official SDKs share the same core capabilities and follow native language conventions.
4. **Tested Conformance:** Every feature must be validated through unit, integration, and recovery tests.

## Development Workflow

1. Fork the repository and create your feature branch.
2. Ensure all tests pass.
3. Adhere to code styling conventions defined in `.editorconfig`.
4. Submit a clear pull request describing the changes, tests executed, and rationale.

## Project Structure

- `crates/`: Rust implementation of the Nexora server and core crates.
- `protocol/`: Binary protocol specifications, versioning rules, and test vectors.
- `sdks/`: Native SDKs for 20 programming languages.
- `website/`: Next.js developer documentation and marketing portal.
- `tests/`: Integration, conformance, and recovery test suites.
- `examples/`: Runnable end-to-end integration examples.
