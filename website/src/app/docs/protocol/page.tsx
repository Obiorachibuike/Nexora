import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Binary Protocol Specification — Nexora Docs',
  description: 'Exhaustive specification of the Nexora Binary Protocol (NBP/1.0): 24-byte framing, correlation IDs, CRC16 verification, and command IDs.',
};

export default function ProtocolDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Wire Protocol
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Nexora Binary Protocol (NBP/1.0)
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          The Nexora Binary Protocol (NBP) is a multiplexed, length-prefixed, request-correlated wire format designed for bidirectional TCP streaming between client SDKs and the server.
        </p>
      </div>

      <div className="space-y-8 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">24-Byte Header Structure</h2>
          <div className="p-4 rounded-xl bg-[#0B1020] border border-white/10 font-mono text-xs text-slate-300">
            <div>Offset 0..3:   Magic bytes: &apos;NEXO&apos; (0x4E, 0x45, 0x58, 0x4F)</div>
            <div>Offset 4:      Protocol Version: 0x01</div>
            <div>Offset 5:      Message Type: 0x01 (Request), 0x02 (Response), 0x03 (Ping), 0x04 (Pong)</div>
            <div>Offset 6..7:   Flags: 16-bit bitfield</div>
            <div>Offset 8..15:  Correlation ID: 64-bit Big-Endian unsigned integer</div>
            <div>Offset 16..17: Command ID (Request) / Status Code (Response): 16-bit Big-Endian</div>
            <div>Offset 18..21: Payload Length: 32-bit Big-Endian unsigned integer</div>
            <div>Offset 22..23: Header Checksum: 16-bit CRC16-CCITT across bytes 0..21</div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Core Command Identifiers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-primary-light">0x0001: AUTH</span> - Authenticate API key
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-primary-light">0x0002: PING</span> - Heartbeat probe
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-accent">0x0010: SET</span> - Key-value write with TTL
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-accent">0x0011: GET</span> - Key-value read
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-emerald-400">0x0020: Q_ADD</span> - Enqueue background job
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-emerald-400">0x0021: Q_FETCH</span> - Atomic worker claim
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-emerald-400">0x0022: Q_ACK</span> - Mark job completed
            </div>
            <div className="p-3 rounded-lg bg-[#10182A] border border-white/5">
              <span className="text-emerald-400">0x0023: Q_FAIL</span> - Report failure / retry
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
