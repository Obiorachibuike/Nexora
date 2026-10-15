import React from 'react';
import Link from 'next/link';
import {
  Terminal,
  Database,
  Layers,
  Activity,
  Bell,
  Clock,
  Users,
  ShieldCheck,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { CodePreviewTabs } from '../components/CodePreviewTabs';
import { SdkGrid } from '../components/SdkGrid';
import { CodeBlock } from '../components/CodeBlock';
import { USE_CASES } from '../data/useCases';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-xs font-mono font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Independent Infrastructure • Not a Redis or BullMQ wrapper</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          One Engine. Twenty Languages.{' '}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Infinite Possibilities.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed">
          Nexora brings background jobs, caching, key-value storage, events, and scheduling together in one independent infrastructure engine—with native SDKs for the programming languages developers already use.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/docs/getting-started"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition"
          >
            <Terminal className="w-4 h-4" />
            Get Started
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/10 transition"
          >
            Explore Documentation
          </Link>
          <a
            href="https://github.com/Obiorachibuike/Nexora"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-text-muted hover:text-text text-sm font-medium transition"
          >
            View Source Code →
          </a>
        </div>

        {/* Quick Command Banner */}
        <div className="mt-10 max-w-xl mx-auto p-2.5 rounded-xl border border-white/10 bg-[#0B1020]/90 flex items-center justify-between text-xs font-mono text-text-muted shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-accent">$</span>
            <span className="text-slate-200">./bin/nexora-server.js --port 6380</span>
          </div>
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-emerald-400 font-semibold border border-white/5">
            TCP + HTTP Ready
          </span>
        </div>
      </section>

      {/* Product Capabilities Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Six Infrastructure Systems. Zero Frankenstein Glue.
          </h2>
          <p className="mt-3 text-sm text-text-muted">
            Stop stitching together three queue libraries, two caching databases, a cron daemon, and custom worker heartbeats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Database,
              color: 'text-primary-light',
              title: 'Persistent Storage',
              desc: 'Custom append-only log engine with IEEE 802.3 CRC32 record framing, segment rotation, and crash-recovery scanners.',
              link: '/docs/storage',
            },
            {
              icon: Layers,
              color: 'text-accent',
              title: 'Background Queues',
              desc: '7-state durable job machine with atomic worker claiming, persistent leases, fencing tokens, exponential backoff, and dead-letter routing.',
              link: '/docs/queues',
            },
            {
              icon: Activity,
              color: 'text-emerald-400',
              title: 'High-Performance Cache',
              desc: 'Sub-millisecond memory cache with millisecond TTL precision, LRU eviction, and atomic compare-and-set.',
              link: '/docs/cache',
            },
            {
              icon: Bell,
              color: 'text-secondary',
              title: 'Event Messaging',
              desc: 'Publish/subscribe topic broker with consumer group offsets, at-least-once delivery guarantees, and sequence tracking.',
              link: '/docs/events',
            },
            {
              icon: Clock,
              color: 'text-amber-400',
              title: 'Job Scheduling',
              desc: 'Persistent interval and cron schedules with offline misfire handling (Skip vs FireOnce) that survives server restarts.',
              link: '/docs/scheduling',
            },
            {
              icon: Users,
              color: 'text-pink-400',
              title: 'Worker Coordination',
              desc: 'Multi-language worker registration, heartbeat tracking, lease renewal, and automatic reclamation of abandoned tasks.',
              link: '/docs/workers',
            },
            {
              icon: ShieldCheck,
              color: 'text-blue-400',
              title: 'Security & Access Control',
              desc: 'Constant-time SHA-256 API key verification, role-based access control, frame length bounding, and zero exposed credentials.',
              link: '/docs/security',
            },
            {
              icon: BarChart2,
              color: 'text-purple-400',
              title: 'Full Observability',
              desc: 'Integrated Prometheus metrics, queue depth tracking, storage diagnostics, and REST management endpoints on port 6381.',
              link: '/docs/observability',
            },
            {
              icon: Zap,
              color: 'text-yellow-400',
              title: 'Binary Wire Protocol',
              desc: '24-byte multiplexed TCP framing (NBP/1.0) with CRC16 header verification, correlation IDs, and binary/JSON payload negotiation.',
              link: '/docs/protocol',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.link}
                className="group p-6 rounded-2xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5"
              >
                <div>
                  <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 border border-white/10 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-primary-light transition mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1 text-xs text-primary-light font-medium group-hover:translate-x-1 transition">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Interactive Architecture Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-primary-light font-semibold">
            System Design
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Engineered for Single-Binary Simplicity
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            All capabilities communicate through Nexora&apos;s own protocol and storage engine.
          </p>
        </div>

        <ArchitectureDiagram />
      </section>

      {/* Multi-Language SDK Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Official SDK Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Native SDKs for 20 Programming Languages
            </h2>
            <p className="mt-2 text-sm text-text-muted max-w-2xl">
              Every SDK talks directly to Nexora&apos;s binary protocol without third-party queue dependencies.
            </p>
          </div>
          <Link
            href="/docs/sdks/typescript"
            className="text-xs font-semibold text-primary-light hover:text-white flex items-center gap-1 transition"
          >
            <span>Browse all SDK references</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <SdkGrid />
      </section>

      {/* Code Examples Tab Switcher */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-primary-light font-semibold">
            Unified Developer Experience
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Write Once in Your Preferred Language
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Consistent methods, typed responses, and native conventions across all clients.
          </p>
        </div>

        <CodePreviewTabs />
      </section>

      {/* Featured Use Cases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
            Real-World Architectures
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Built for Critical Application Workloads
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {USE_CASES.slice(0, 4).map((uc) => (
            <Link
              key={uc.id}
              href={`/use-cases#${uc.id}`}
              className="p-5 rounded-xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between group"
            >
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-primary-light transition mb-2">
                  {uc.title}
                </h3>
                <p className="text-xs text-text-muted line-clamp-3">
                  {uc.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1 text-xs text-primary-light font-medium">
                <span>View architecture</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5-Step Getting Started */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Running in Under 60 Seconds
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            No external database setup, no Docker requirement, no configuration headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
            <span className="text-xs font-mono text-primary font-bold">STEP 01</span>
            <h3 className="text-base font-bold text-white mt-1 mb-2">Start the Server</h3>
            <p className="text-xs text-text-muted mb-4">
              Launch the binary server with custom storage path and port:
            </p>
            <CodeBlock code="./bin/nexora-server.js --port 6380" language="bash" />
          </div>

          <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
            <span className="text-xs font-mono text-accent font-bold">STEP 02</span>
            <h3 className="text-base font-bold text-white mt-1 mb-2">Install an SDK</h3>
            <p className="text-xs text-text-muted mb-4">
              Install the client in your application project:
            </p>
            <CodeBlock code="npm install @nexora/client\n# or: pip install nexora" language="bash" />
          </div>

          <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
            <span className="text-xs font-mono text-emerald-400 font-bold">STEP 03</span>
            <h3 className="text-base font-bold text-white mt-1 mb-2">Dispatch & Persist</h3>
            <p className="text-xs text-text-muted mb-4">
              Write durable data or submit background jobs:
            </p>
            <CodeBlock code="await store.set('key', 'val');\nawait queue.add('task', { id: 1 });" language="typescript" />
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xl shadow-primary/25 transition"
          >
            <span>Read Full Getting-Started Tutorial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
