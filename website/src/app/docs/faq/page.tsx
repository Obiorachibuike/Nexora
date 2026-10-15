import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';

export const metadata = {
  title: 'Frequently Asked Questions — Nexora Docs',
  description: 'Frequently asked questions regarding Nexora architecture, persistence, and comparisons.',
};

export default function FaqDocsPage() {
  const faqs = [
    {
      q: 'Is Nexora a wrapper around Redis or BullMQ?',
      a: 'No. Nexora is an independent infrastructure implementation with its own append-only log storage engine, custom binary wire protocol, and queue state machine. It does not embed Redis, BullMQ, RocksDB, or SQLite.',
    },
    {
      q: 'What are the delivery guarantees for jobs?',
      a: 'Nexora guarantees at-least-once delivery. If a worker machine crashes mid-job, its lease expires, and another worker claims the task. We recommend designing job handlers to be idempotent using deduplication keys.',
    },
    {
      q: 'How does crash recovery work?',
      a: 'On boot, Nexora scans all log segments, verifies IEEE 802.3 CRC32 checksums, detects and truncates uncommitted torn writes at the tail, and reconstructs the in-memory index in milliseconds.',
    },
    {
      q: 'Can all 20 language SDKs talk to the same server simultaneously?',
      a: 'Yes! All 20 SDKs connect over the same multiplexed binary protocol over TCP. A Python web application can enqueue an email job, and a Go or Rust worker can claim and process it.',
    },
  ];

  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          FAQ
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-[#10182A] border border-white/5">
            <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </DocsLayout>
  );
}
