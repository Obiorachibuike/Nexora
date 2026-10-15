'use client';

import React from 'react';
import { Database, Layers, Clock, Bell, Users, Cpu, ShieldCheck, ArrowDown, Activity } from 'lucide-react';

export function ArchitectureDiagram() {
  return (
    <div className="w-full my-8 p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0B1020]/90 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Layer 1: Client Applications */}
      <div className="relative z-10 text-center mb-6">
        <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
          Layer 1: Multi-Language Client Ecosystem
        </span>
        <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {[
            'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
            'C++', 'C', 'Java', 'C#', 'PHP',
            'Ruby', 'Kotlin', 'Swift', 'Dart', 'Elixir',
            'Scala', 'R', 'Julia', 'Lua', 'Perl'
          ].map((lang) => (
            <div
              key={lang}
              className="py-2 px-1 text-center rounded-lg bg-[#10182A] border border-white/5 hover:border-primary/50 text-[11px] font-mono font-medium text-slate-300 transition shadow-sm"
            >
              {lang}
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Transition */}
      <div className="flex flex-col items-center my-4 relative z-10">
        <ArrowDown className="w-5 h-5 text-primary animate-bounce" />
        <div className="px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-mono text-primary-light font-semibold my-1">
          Nexora Binary Protocol (NBP/1.0) • 24-Byte Framed TCP Socket • CRC16 Checksums
        </div>
        <ArrowDown className="w-5 h-5 text-primary" />
      </div>

      {/* Layer 2: Nexora Core Server */}
      <div className="relative z-10 rounded-xl border border-white/10 bg-[#10182A]/80 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              NEXORA UNIFIED INFRASTRUCTURE ENGINE (Single Binary Server)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-subtle">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Port 6380 (TCP) • Port 6381 (HTTP)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-[#0B1020] border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-2 text-primary-light font-semibold text-xs mb-1">
              <Database className="w-4 h-4" />
              <span>Persistent Storage Engine</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Append-only log (AOF), 35-byte framing, IEEE 802.3 CRC32, monotonic seq, torn-write truncation.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0B1020] border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-2 text-accent font-semibold text-xs mb-1">
              <Layers className="w-4 h-4" />
              <span>Durable Job Queues</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              7-state machine, atomic claiming, worker leases, fencing tokens, exponential backoff, DLQ.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0B1020] border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Activity className="w-4 h-4" />
              <span>High-Performance Cache</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Sub-millisecond memory cache, millisecond TTL expiration, LRU eviction, atomic CAS and INCR.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0B1020] border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-2 text-secondary font-semibold text-xs mb-1">
              <Bell className="w-4 h-4" />
              <span>Event Messaging Broker</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Topic publishing, consumer group offset tracking, at-least-once delivery, event retention.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0B1020] border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
              <Clock className="w-4 h-4" />
              <span>Persistent Job Scheduler</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Interval & cron schedules, misfire recovery policies, durable restart state restoration.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0B1020] border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-2 text-pink-400 font-semibold text-xs mb-1">
              <Users className="w-4 h-4" />
              <span>Worker Coordinator</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Heartbeat monitoring, stale worker eviction, lease reclamation, graceful shutdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
