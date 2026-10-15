import React from 'react';
import { ShieldCheck, Lock, Key, AlertOctagon } from 'lucide-react';

export const metadata = {
  title: 'Security & Threat Model — Nexora',
  description: 'Nexora security architecture: Constant-time authentication, frame size limits, secret redaction, and safe defaults.',
};

export default function SecurityPage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Security Architecture
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
          Security as a Core Engineering Foundation
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          Infrastructure engines reside at the heart of application architecture. Nexora treats security not as an afterthought, but as an essential requirement from the very first frame.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
          <div className="p-3 w-fit rounded-xl bg-primary/10 border border-primary/20 text-primary-light mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Constant-Time API Key Verification</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            All token and API key comparisons use constant-time equality algorithms (such as the <code>subtle</code> crate in Rust and <code>crypto.timingSafeEqual</code> in JavaScript/Node) to eliminate side-channel timing attacks during authentication.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
          <div className="p-3 w-fit rounded-xl bg-accent/10 border border-accent/20 text-accent mb-4">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Maximum Frame Bounds (16 MB)</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Network frames exceeding 16 MB are rejected at the protocol header decoding stage before allocating memory buffers, preventing resource exhaustion and denial-of-service vectors.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
          <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Zero Hardcoded Credentials</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The server does not include fallback hardcoded passwords or default credentials. For remote deployments, an explicit API key must be supplied via configuration files or the <code>--api-key</code> flag.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#10182A] border border-white/5">
          <div className="p-3 w-fit rounded-xl bg-secondary/10 border border-secondary/20 text-secondary mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Safe Error Propagation</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Internal filesystem paths, database queries, and server memory details are never leaked in client error responses. All server errors use sanitized status codes and opaque error messages.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B1020] border border-white/10 text-xs text-text-muted">
        <h4 className="text-sm font-bold text-white mb-2">Reporting a Security Vulnerability</h4>
        <p className="leading-relaxed">
          If you discover a vulnerability or security issue within the Nexora server or any official SDK, please do not open a public issue. Email our security team at <code className="text-primary-light">security@nexora.dev</code>. We respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
