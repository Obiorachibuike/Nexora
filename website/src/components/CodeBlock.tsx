'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="relative my-4 rounded-xl border border-white/10 bg-[#0B1020] overflow-hidden text-sm">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#070910]/50 text-xs text-text-muted font-mono">
          <span>{filename}</span>
          <span className="text-[10px] uppercase tracking-wider text-text-subtle">{language}</span>
        </div>
      )}
      <button
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-text-muted hover:text-text border border-white/10 transition text-xs font-medium z-10"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>
      <pre className="p-4 overflow-x-auto font-mono text-xs md:text-sm leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
