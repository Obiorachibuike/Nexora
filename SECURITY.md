# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The Nexora team takes system security and durability seriously. If you find any security flaw, authentication bypass, remote execution, or data corruption vulnerability in Nexora:

1. **Do not open a public issue.**
2. Send a report to **security@nexora.dev**.
3. Include detailed steps to reproduce, relevant protocol traces, and impact assessment.
4. We acknowledge receipt within 24 hours and aim to provide a remediation plan within 72 hours.

## Security Practices

- **Zero hardcoded credentials:** Nexora requires explicit API keys for all non-local connections.
- **Constant-time comparisons:** All token verification uses constant-time string/byte equality to prevent timing attacks.
- **Frame limits:** Network frames are bounded to `16 MB` by default to prevent buffer-exhaustion attacks.
- **Append-only verification:** All storage records are guarded with CRC32 checksums and torn-write scanners.
