'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, FileText, Code, Layers } from 'lucide-react';
import { SDKS } from '../data/sdks';
import { DOCS_NAV } from '../data/docsNav';
import { USE_CASES } from '../data/useCases';

interface SearchResult {
  title: string;
  category: string;
  href: string;
  snippet: string;
  icon: 'doc' | 'sdk' | 'usecase';
}

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or custom event
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results: SearchResult[] = [];
  const q = query.toLowerCase().trim();

  if (q.length > 0) {
    // Search docs
    DOCS_NAV.forEach(section => {
      section.items.forEach(item => {
        if (item.title.toLowerCase().includes(q)) {
          results.push({
            title: item.title,
            category: section.title,
            href: item.href,
            snippet: `Documentation: ${item.title} guide`,
            icon: 'doc',
          });
        }
      });
    });

    // Search SDKs
    SDKS.forEach(sdk => {
      if (
        sdk.name.toLowerCase().includes(q) ||
        sdk.packageName.toLowerCase().includes(q) ||
        sdk.description.toLowerCase().includes(q)
      ) {
        results.push({
          title: `${sdk.name} SDK`,
          category: 'SDK Reference',
          href: `/docs/sdks/${sdk.slug}`,
          snippet: sdk.description,
          icon: 'sdk',
        });
      }
    });

    // Search Use cases
    USE_CASES.forEach(uc => {
      if (
        uc.title.toLowerCase().includes(q) ||
        uc.description.toLowerCase().includes(q) ||
        uc.tagline.toLowerCase().includes(q)
      ) {
        results.push({
          title: uc.title,
          category: 'Use Cases',
          href: `/use-cases#${uc.id}`,
          snippet: uc.tagline,
          icon: 'usecase',
        });
      }
    });
  }

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0B1020] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#10182A]">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation, SDKs, queues, commands... (Press ESC to close)"
            autoFocus
            className="flex-1 bg-transparent text-text placeholder-text-subtle text-sm outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/5">
          {q.length === 0 ? (
            <div className="p-8 text-center text-text-subtle text-sm">
              Type keywords to search across Nexora documentation, SDK guides, and use cases.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-text-subtle text-sm">
              No results found for &ldquo;<span className="text-text">{query}</span>&rdquo;.
            </div>
          ) : (
            results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(res.href)}
                className="w-full text-left p-3 rounded-lg hover:bg-[#17223B] transition flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-white/5 border border-white/10 text-primary-light">
                    {res.icon === 'doc' && <FileText className="w-4 h-4" />}
                    {res.icon === 'sdk' && <Code className="w-4 h-4" />}
                    {res.icon === 'usecase' && <Layers className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text group-hover:text-primary-light transition">
                        {res.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-subtle uppercase tracking-wider">
                        {res.category}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{res.snippet}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-subtle group-hover:text-primary-light group-hover:translate-x-0.5 transition" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
