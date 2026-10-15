import React from 'react';
import { Database, Layers, Activity, Bell, Clock, Users, ShieldCheck, Zap, HardDrive, Cpu, Terminal } from 'lucide-react';

export const metadata = {
  title: 'Features — Nexora',
  description: 'Deep dive into Nexora features: append-only durability, 7-state queues, atomic worker leases, cron scheduling, and 20 language SDKs.',
};

export default function FeaturesPage() {
  const features = [
    {
      icon: Database,
      title: 'Persistent Key-Value Store',
      points: [
        'SET, GET, DEL, EXISTS, EXPIRE, TTL operations',
        'Atomic set-if-absent (SET_NX) and compare-and-set (CAS)',
        'Atomic 64-bit integer increment/decrement (INCR, DECR)',
        'Prefix-based key iteration with safe pagination',
        'TTL expiration with monotonic clock precision',
      ],
    },
    {
      icon: Layers,
      title: 'Durable Background Queues',
      points: [
        '7-state machine: Waiting, Delayed, Active, Completed, Failed, Cancelled, Dead-lettered',
        'Atomic claiming across competing workers',
        'Persistent leases with fencing tokens preventing zombie commits',
        'Configurable exponential backoff retries with jitter',
        'Dead-letter queues with CLI inspection and manual requeue',
      ],
    },
    {
      icon: Activity,
      title: 'High-Performance Cache',
      points: [
        'In-memory hot cache layered atop durable storage',
        'LRU eviction under configurable memory bounds',
        'Sub-millisecond read latency',
        'Strict isolation between durable records and evictable cache keys',
      ],
    },
    {
      icon: Bell,
      title: 'Pub/Sub & Event Messaging',
      points: [
        'Named event topics with ordered sequence identifiers',
        'Consumer group subscriptions with progress offset tracking',
        'Consumer acknowledgments and at-least-once delivery',
        'Configurable event retention and historical replay',
      ],
    },
    {
      icon: Clock,
      title: 'Recurring Job Scheduling',
      points: [
        'Recurring interval jobs (milliseconds to days)',
        'Cron expression scheduling with time-zone awareness',
        'Misfire handling: Skip vs FireOnce for offline recovery',
        'Persistent definitions surviving server restarts',
      ],
    },
    {
      icon: Users,
      title: 'Worker Coordination',
      points: [
        'Worker identity and heartbeat registry',
        'Heartbeat timeouts and stale-worker eviction',
        'Automatic reclamation of abandoned jobs to the queue',
        'Graceful worker drain and cancellation signals',
      ],
    },
    {
      icon: Zap,
      title: 'Binary Wire Protocol (NBP/1.0)',
      points: [
        '24-byte multiplexed TCP framing with magic bytes NEXO',
        '64-bit request/response correlation IDs',
        'Header integrity verification via CRC16',
        'Standard error status codes and structured payloads',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      points: [
        'Constant-time SHA-256 API key authentication',
        'Role-based access control (Admin, ReadWrite, ReadOnly)',
        '16 MB maximum frame size protecting against buffer exhaustion',
        'Safe error handling with zero credential leakage in logs',
      ],
    },
    {
      icon: Terminal,
      title: 'CLI & Administration',
      points: [
        'Full nexora CLI tool for server management',
        'Diagnostic nexora doctor checks',
        'HTTP management endpoints on port 6381',
        'Prometheus metrics integration at /metrics',
      ],
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Platform Capabilities
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
          Everything You Need to Power Modern Background Infrastructure
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          Nexora is designed from the ground up for extreme reliability, zero hidden external dependencies, and unified cross-language consistency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl bg-[#10182A] border border-white/5 flex flex-col justify-between">
              <div>
                <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 text-primary-light mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-3">{f.title}</h3>
                <ul className="space-y-2 text-xs text-text-muted">
                  {f.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2">
                      <span className="text-primary-light mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
