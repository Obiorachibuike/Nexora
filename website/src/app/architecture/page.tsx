import React from 'react';
import { ArchitectureDiagram } from '../../components/ArchitectureDiagram';
import { CodeBlock } from '../../components/CodeBlock';

export const metadata = {
  title: 'Architecture Deep-Dive — Nexora',
  description: 'Technical architecture of Nexora: Storage engine design, record framing, write-ahead durability, queue state machine, and binary wire protocol.',
};

export default function ArchitecturePage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Architecture & Internals
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
          Deep-Dive into the Nexora Engine Internals
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          Nexora is designed as an independent infrastructure server. It does not embed SQLite, wrap Redis, or depend on RocksDB. Below is an exhaustive breakdown of its on-disk storage engine, binary protocol, and queue state machine.
        </p>
      </div>

      <ArchitectureDiagram />

      <div className="mt-16 space-y-16">
        <section className="border-t border-white/5 pt-12">
          <h2 className="text-2xl font-bold text-white mb-4">1. Append-Only Log Storage Engine (AOF)</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            All writes to key-value pairs, queue state transitions, events, and schedules append structured binary records to disk segment files (e.g. <code>segment_00000001.log</code>).
            Every record starts with a 2-byte magic prefix (<code>0xAA55</code>), followed by a 1-byte record type, an 8-byte monotonic sequence number, an 8-byte creation timestamp, an 8-byte expiration timestamp, 4-byte key length, and 4-byte value length.
            The payload is followed by a 4-byte IEEE 802.3 CRC32 checksum computed across all bytes from the record type through the value payload.
          </p>

          <div className="p-6 rounded-2xl bg-[#0B1020] border border-white/10 font-mono text-xs text-slate-300">
            <div className="text-primary-light mb-2 font-bold">// Record Header Layout (Fixed 35 Bytes + CRC32 4 Bytes)</div>
            <div>[0..2]   Magic: 0xAA 0x55 (2 bytes)</div>
            <div>[2]      RecordType: 1=SET, 2=DEL, 3=EXPIRE, 4=QUEUE_CREATE, 5=QUEUE_UPDATE, 6=EVENT, 7=SCHEDULE</div>
            <div>[3..11]  Sequence: u64 Big-Endian monotonic counter</div>
            <div>[11..19] Timestamp: u64 Big-Endian Unix epoch ms</div>
            <div>[19..27] ExpiresAt: u64 Big-Endian epoch ms (0 = persistent)</div>
            <div>[27..31] KeyLen: u32 Big-Endian key byte length</div>
            <div>[31..35] ValLen: u32 Big-Endian value byte length</div>
            <div>[35..]   Key Bytes [KeyLen] + Value Bytes [ValLen]</div>
            <div>[tail]   CRC32: u32 Big-Endian IEEE 802.3 checksum of bytes 2..tail</div>
          </div>
        </section>

        <section className="border-t border-white/5 pt-12">
          <h2 className="text-2xl font-bold text-white mb-4">2. Crash Recovery & Torn-Write Truncation</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            When a Nexora server boots up, its recovery scanner opens all segment files sequentially.
            It decodes each record, verifies the <code>0xAA55</code> magic bytes and recalculates the CRC32 checksum.
            If the server crashed mid-write during a power cut, the partial bytes at the end of the latest log file will fail either the header length check, magic validation, or CRC32 verification.
            Upon detecting this condition, Nexora automatically truncates the log file back to the last known valid offset, logs the action to operator output, and continues loading without data corruption.
          </p>
        </section>

        <section className="border-t border-white/5 pt-12">
          <h2 className="text-2xl font-bold text-white mb-4">3. Fencing Tokens & Worker Leases</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            In distributed background queue processing, the &ldquo;zombie worker&rdquo; problem is the primary source of duplicate side-effects.
            If Worker A claims a job with a 30s lease, encounters an unexpected 40s garbage collection pause or network freeze, the server will detect the expired lease and reassign the job to Worker B.
            When Worker A finally unfreezes, it must be prevented from completing or acknowledging the job.
          </p>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Nexora solves this by issuing a strictly monotonic <strong>fencing token</strong> with every lease claim.
            When Worker A attempts to acknowledge or fail the job with its stale fencing token, the Nexora engine rejects the request with status <code>0x0007 (LEASE_EXPIRED)</code>, guaranteeing that only the authoritative lease holder can commit state transitions.
          </p>
        </section>
      </div>
    </div>
  );
}
