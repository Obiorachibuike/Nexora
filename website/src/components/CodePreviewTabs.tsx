'use client';

import React, { useState } from 'react';
import { SDKS } from '../data/sdks';
import { CodeBlock } from './CodeBlock';

const FEATURED_SLUGS = ['typescript', 'python', 'go', 'rust', 'cpp', 'c', 'java', 'csharp', 'php', 'ruby'];

export function CodePreviewTabs() {
  const [activeSlug, setActiveSlug] = useState('typescript');

  const featured = SDKS.filter(s => FEATURED_SLUGS.includes(s.slug));
  const activeSdk = featured.find(s => s.slug === activeSlug) || featured[0];

  return (
    <div className="w-full my-8 rounded-2xl border border-white/10 bg-[#0B1020] overflow-hidden shadow-2xl">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-[#070910] overflow-x-auto scrollbar-none">
        {featured.map((sdk) => (
          <button
            key={sdk.slug}
            onClick={() => setActiveSlug(sdk.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono whitespace-nowrap transition ${
              activeSlug === sdk.slug
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/5'
            }`}
          >
            {sdk.name}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{activeSdk.name} SDK Example</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-primary-light border border-white/10">
                {activeSdk.packageName}
              </span>
            </h4>
            <p className="text-xs text-text-muted mt-0.5">{activeSdk.description}</p>
          </div>
          <div className="text-xs font-mono text-text-subtle">
            Install: <code className="text-emerald-400 bg-white/5 px-2 py-0.5 rounded">{activeSdk.installCmd}</code>
          </div>
        </div>

        <CodeBlock code={activeSdk.codeSnippet} language={activeSdk.slug} filename={`app.${activeSdk.slug === 'typescript' ? 'ts' : activeSdk.slug === 'python' ? 'py' : activeSdk.slug === 'go' ? 'go' : activeSdk.slug}`} />
      </div>
    </div>
  );
}
