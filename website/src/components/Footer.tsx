import React from 'react';
import Link from 'next/link';
import { Zap, Github, Shield, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070910] text-text-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">NEXORA</span>
          </div>
          <p className="text-xs text-text-subtle max-w-sm mb-4 leading-relaxed">
            Independent infrastructure engine combining durable background jobs, key-value storage, caching, event messaging, and scheduling in one single server.
          </p>
          <div className="flex items-center gap-3 text-xs text-text-subtle">
            <a href="https://github.com/Obiorachibuike/Nexora" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-text transition">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <span>•</span>
            <Link href="/security" className="flex items-center gap-1 hover:text-text transition">
              <Shield className="w-3.5 h-3.5" /> Security
            </Link>
            <span>•</span>
            <span>MIT / Apache-2.0</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/product" className="hover:text-text transition">Product Overview</Link></li>
            <li><Link href="/features" className="hover:text-text transition">Features</Link></li>
            <li><Link href="/architecture" className="hover:text-text transition">Architecture</Link></li>
            <li><Link href="/performance" className="hover:text-text transition">Performance</Link></li>
            <li><Link href="/security" className="hover:text-text transition">Security</Link></li>
            <li><Link href="/roadmap" className="hover:text-text transition">Roadmap</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Documentation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/docs/getting-started" className="hover:text-text transition">Getting Started</Link></li>
            <li><Link href="/docs/installation" className="hover:text-text transition">Installation</Link></li>
            <li><Link href="/docs/protocol" className="hover:text-text transition">Binary Protocol (NBP)</Link></li>
            <li><Link href="/docs/storage" className="hover:text-text transition">Append-Only Storage</Link></li>
            <li><Link href="/docs/queues" className="hover:text-text transition">Durable Queues</Link></li>
            <li><Link href="/docs/workers" className="hover:text-text transition">Worker Leases</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Languages</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/docs/sdks/typescript" className="hover:text-text transition">TypeScript</Link></li>
            <li><Link href="/docs/sdks/python" className="hover:text-text transition">Python</Link></li>
            <li><Link href="/docs/sdks/go" className="hover:text-text transition">Go</Link></li>
            <li><Link href="/docs/sdks/rust" className="hover:text-text transition">Rust</Link></li>
            <li><Link href="/docs/sdks/cpp" className="hover:text-text transition">C++</Link></li>
            <li><Link href="/docs" className="text-primary-light hover:text-white transition">All 20 SDKs →</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-subtle">
        <p>© 2026 Nexora Project. Built as an independent infrastructure platform.</p>
        <p>Not affiliated with Redis or BullMQ. Powered by custom append-only storage and NBP/1.0 wire protocol.</p>
      </div>
    </footer>
  );
}
