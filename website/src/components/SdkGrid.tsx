'use client';

import React from 'react';
import Link from 'next/link';
import { SDKS, SdkMeta } from '../data/sdks';
import { ArrowUpRight } from 'lucide-react';

export function SdkGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
      {SDKS.map((sdk) => {
        const badgeColor =
          sdk.status === 'Stable'
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : sdk.status === 'Beta'
            ? 'bg-primary/15 text-primary-light border-primary/30'
            : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

        return (
          <Link
            key={sdk.slug}
            href={`/docs/sdks/${sdk.slug}`}
            className="group p-4 rounded-xl bg-[#10182A] border border-white/5 hover:border-white/20 transition flex flex-col justify-between hover:shadow-lg hover:shadow-primary/5"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white group-hover:text-primary-light transition">
                  {sdk.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeColor}`}>
                  {sdk.status}
                </span>
              </div>
              <p className="text-xs text-text-muted line-clamp-2 mb-3">
                {sdk.description}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-text-subtle">
              <span>{sdk.registry}</span>
              <span className="flex items-center gap-0.5 text-primary-light group-hover:translate-x-0.5 transition">
                Docs <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
