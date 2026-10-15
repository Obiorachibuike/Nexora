import React from 'react';
import { USE_CASES } from '../../data/useCases';
import { CodeBlock } from '../../components/CodeBlock';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Real-World Use Cases — Nexora',
  description: 'Production use cases powered by Nexora: Transactional emails, AI document processing, webhook delivery, e-commerce order pipelines, scheduled reports, and caching.',
};

export default function UseCasesPage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-16">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Architectural Patterns
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
          Engineered for Real-World Production Workloads
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          Explore eight concrete architectural patterns showing how Nexora replaces multi-tool infrastructure stacks with one reliable engine.
        </p>
      </div>

      <div className="space-y-16">
        {USE_CASES.map((uc, idx) => (
          <section
            key={uc.id}
            id={uc.id}
            className="p-8 rounded-3xl bg-[#10182A] border border-white/5 scroll-mt-24 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
              <div>
                <span className="text-xs font-mono text-primary-light font-semibold">
                  CASE 0{idx + 1}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">{uc.title}</h2>
                <p className="text-xs text-text-muted mt-1">{uc.tagline}</p>
              </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed mb-6">
              {uc.description}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              <div className="p-5 rounded-2xl bg-[#0B1020] border border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Execution Flow
                </h3>
                <ul className="space-y-2 text-xs text-text-muted">
                  {uc.architecture.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="text-accent font-mono font-semibold">{sIdx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1020] border border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Engineering Considerations
                </h3>
                <ul className="space-y-2 text-xs text-text-muted">
                  {uc.considerations.map((c, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono text-text-subtle mb-2">Implementation Example:</h4>
              <CodeBlock code={uc.codeExample} language="typescript" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
