import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

export const metadata = {
  title: 'Engineering Roadmap — Nexora',
  description: 'Phased development roadmap of Nexora: From Phase 0 architecture to single-node engine, 20 SDKs, and distributed clustering.',
};

export default function RoadmapPage() {
  const phases = [
    {
      phase: 'Phase 0 & 1',
      title: 'Repository Architecture & Minimal Working Engine',
      status: 'Completed',
      items: [
        'Protocol specification (NBP/1.0) with CRC16 framing and test vectors',
        'Append-only log storage engine (AOF) with CRC32 records and sequence numbers',
        'Crash recovery scanner with torn-write tail truncation',
        'Key-value storage API (SET, GET, DEL, EXISTS, EXPIRE, TTL, INCR)',
        'TCP binary server and HTTP management server on ports 6380/6381',
        'Official TypeScript SDK with live end-to-end restart persistence tests',
      ],
    },
    {
      phase: 'Phase 2',
      title: 'Durable Background Queue & Worker Coordination',
      status: 'Completed',
      items: [
        '7-state job state machine (Waiting, Delayed, Active, Completed, Failed, Cancelled, Dead-lettered)',
        'Atomic worker claiming with persistent leases and fencing tokens',
        'Exponential backoff retries with jitter',
        'Dead-letter queue inspection and routing',
      ],
    },
    {
      phase: 'Phase 3 & 4',
      title: 'Cache, Events & Persistent Scheduler',
      status: 'Completed',
      items: [
        'Hot cache layer with LRU eviction and memory bounds',
        'Event topics and consumer group progress offset tracking',
        'Recurring interval and cron scheduling with restart recovery and misfire policies',
      ],
    },
    {
      phase: 'Phase 5 & 6',
      title: 'Full 20 Native Language SDK Ecosystem',
      status: 'Completed',
      items: [
        'TypeScript and JavaScript SDKs (@nexora/client, nexora)',
        'Python SDK with native TCP socket framing (nexora on PyPI)',
        'C and C++ native client libraries with RAII and zero-copy framing',
        'Go SDK with context and goroutine safety',
        'Rust async client crate (tokio-native)',
        'Java, C#, PHP, Ruby, Kotlin, Swift, Dart, Elixir, Scala, R, Julia, Lua, Perl SDK packages',
      ],
    },
    {
      phase: 'Phase 7 & 8',
      title: 'Operational Hardening & Production Preparation',
      status: 'In Progress',
      items: [
        'Automated benchmark suite and latency profiling',
        'Segment log compaction and snapshotting',
        'Comprehensive documentation portal and official developer website',
      ],
    },
    {
      phase: 'Phase 9',
      title: 'Replication & Distributed Clustering',
      status: 'Planned',
      items: [
        'Multi-node consensus and log replication protocol',
        'Automatic leader election and partition handling',
        'Cross-datacenter queue replication',
      ],
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Development Milestones
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
          Nexora Engineering Roadmap
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          Nexora is engineered strictly in measured phases. We stabilize the core storage engine and protocol contracts before scaling language support and distributed replication.
        </p>
      </div>

      <div className="space-y-8">
        {phases.map((p, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-text-subtle font-bold">{p.phase}</span>
                <span className="text-white font-bold text-base">• {p.title}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                  p.status === 'Completed'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : p.status === 'In Progress'
                    ? 'bg-primary/15 text-primary-light border-primary/30'
                    : 'bg-white/5 text-text-subtle border-white/10'
                }`}
              >
                {p.status}
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted mt-3">
              {p.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
