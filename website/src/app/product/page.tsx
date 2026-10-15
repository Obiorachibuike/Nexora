import React from 'react';
import Link from 'next/link';
import { Database, Layers, Activity, Bell, Clock, Users, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Product Overview — Nexora',
  description: 'Understand how Nexora unifies durable queues, key-value storage, caching, events, and scheduling into one independent server.',
};

export default function ProductPage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-16">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Product Overview
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
          An Independent Infrastructure Engine Built from First Principles
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          Modern architectures frequently require persistent queues for background work, low-latency caches for database offloading, cron services for scheduling, and pub/sub brokers for microservices.
          Traditionally, teams maintain 3 to 4 distinct services (e.g. Redis, BullMQ, Celery, RabbitMQ, cron daemons), each with separate connection pools, failover logic, and operational overhead.
        </p>
      </div>

      <div className="space-y-16">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-white/5 pt-12">
          <div>
            <div className="p-3 w-fit rounded-xl bg-primary/10 border border-primary/20 text-primary-light mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">1. Custom Append-Only Storage Engine (AOF)</h2>
            <p className="mt-3 text-sm text-text-muted leading-relaxed">
              Nexora does not use SQLite, RocksDB, or Redis. It implements its own append-only log format featuring 35-byte binary headers, monotonic 64-bit sequence numbers, millisecond timestamps, and IEEE 802.3 CRC32 checksums on every record.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-text-muted">
              <li>• Configurable synchronization policies: <code className="text-primary-light">fsync</code>, <code className="text-primary-light">everysec</code>, or <code className="text-primary-light">none</code>.</li>
              <li>• Automated torn-write detection that cleanly truncates uncommitted tails after power cuts.</li>
              <li>• Monotonic sequence numbering preventing out-of-order writes.</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-[#0B1020] border border-white/10 font-mono text-xs text-slate-300">
            <div className="text-text-subtle mb-2">// On-Disk Framing Record</div>
            <div className="text-accent">0xAA55 [Magic 2B]</div>
            <div className="text-primary-light">0x01   [RecordType: SET]</div>
            <div>0x0000000000000042 [Seq: 66]</div>
            <div>0x0000018B478A3310 [Timestamp: 1791907400000]</div>
            <div className="text-emerald-400">0x0000018B478B1D90 [ExpiresAt: 1791907460000]</div>
            <div>0x00000008 [KeyLen: 8 bytes]</div>
            <div>0x00000016 [ValLen: 22 bytes]</div>
            <div className="text-yellow-400">0xD4A11850 [IEEE 802.3 CRC32 Checksum]</div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-white/5 pt-12">
          <div className="order-2 md:order-1 p-6 rounded-2xl bg-[#0B1020] border border-white/10 font-mono text-xs text-slate-300">
            <div className="text-text-subtle mb-2">// Queue State Transitions</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span>Waiting</span> <span>→</span> <span className="text-accent">Active (Leased)</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted mt-1">
              <span>Active</span> <span>→</span> <span className="text-primary-light">Completed</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400 mt-1">
              <span>Active</span> <span>→</span> <span className="text-amber-400">Delayed (Backoff)</span>
            </div>
            <div className="flex items-center gap-2 text-rose-500 mt-1">
              <span>Failed Max Attempts</span> <span>→</span> <span className="text-red-400 font-bold">DeadLettered</span>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="p-3 w-fit rounded-xl bg-accent/10 border border-accent/20 text-accent mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">2. Durable Background Job Queues</h2>
            <p className="mt-3 text-sm text-text-muted leading-relaxed">
              Background job processing built directly on top of the append-only storage engine. Workers across any of the 20 supported languages compete for jobs with atomic leases, fencing tokens, and automatic recovery of abandoned tasks.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-text-muted">
              <li>• At-least-once delivery guarantees with idempotent fencing tokens.</li>
              <li>• Exponential backoff retries with optional jitter.</li>
              <li>• Priority-aware scheduling preventing low-priority starvation.</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="mt-16 p-8 rounded-2xl bg-[#10182A] border border-white/10 text-center">
        <h3 className="text-xl font-bold text-white">Ready to deploy Nexora?</h3>
        <p className="text-xs text-text-muted mt-2 max-w-xl mx-auto">
          Start with our single-command installation and run your first job in minutes.
        </p>
        <Link
          href="/docs/getting-started"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
