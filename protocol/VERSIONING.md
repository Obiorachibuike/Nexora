# Nexora Protocol Versioning & Compatibility Policy

## Semantic Protocol Versioning

Nexora protocol versions follow the form `MAJOR.MINOR`:
- **MAJOR:** Incremented when an incompatible wire format change occurs (e.g., changes to header layout, checksum algorithm, or framing magic).
- **MINOR:** Incremented when backward-compatible commands, optional flags, or additive payload fields are introduced.

## Compatibility Guarantees

1. **Forward Compatibility:** A Nexora server running NBP 1.x MUST safely reject or ignore unknown optional flags while returning structured error `0x0004` (BAD_REQUEST) for unknown command IDs without terminating the TCP socket connection.
2. **Backward Compatibility:** All minor releases within NBP 1.x support client SDKs built against 1.0.
3. **Deprecation Window:** Deprecated commands must be retained for at least two minor versions before removal.
