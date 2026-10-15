'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_NAV } from '../data/docsNav';
import { ChevronRight, Menu, X, BookOpen } from 'lucide-react';

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden flex items-center justify-between pb-4 mb-6 border-b border-white/5">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-primary-light px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
        >
          <Menu className="w-4 h-4" />
          <span>Documentation Menu</span>
        </button>
      </div>

      <div className="flex gap-10">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#070910] p-6 border-r border-white/10 transform transition-transform duration-200 lg:relative lg:translate-x-0 lg:p-0 lg:bg-transparent lg:border-none ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <span className="font-bold text-sm text-white">Documentation</span>
            <button onClick={() => setMobileSidebarOpen(false)} className="text-text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
            {DOCS_NAV.map((section, sIdx) => (
              <div key={sIdx}>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-text-subtle font-bold mb-2.5">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item, iIdx) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={iIdx}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            isActive
                              ? 'bg-primary/15 text-primary-light font-semibold border border-primary/20'
                              : 'text-text-muted hover:text-text hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <article className="flex-1 min-w-0 max-w-3xl pb-16">
          {children}
        </article>
      </div>
    </div>
  );
}
