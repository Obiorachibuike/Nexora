'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, Github, Terminal, Zap } from 'lucide-react';
import { SearchModal } from './SearchModal';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#070910]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-primary-light transition">
                NEXORA
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link href="/product" className="hover:text-text transition">Product</Link>
            <Link href="/features" className="hover:text-text transition">Features</Link>
            <Link href="/architecture" className="hover:text-text transition">Architecture</Link>
            <Link href="/use-cases" className="hover:text-text transition">Use Cases</Link>
            <Link href="/docs" className="hover:text-text transition">Documentation</Link>
            <Link href="/performance" className="hover:text-text transition">Performance</Link>
            <Link href="/security" className="hover:text-text transition">Security</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs text-text-muted hover:text-text transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search docs...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded border border-white/10 text-text-subtle">
                ⌘K
              </kbd>
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/Obiorachibuike/Nexora"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-white/5 border border-transparent hover:border-white/10 transition"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* CTA */}
            <Link
              href="/docs/getting-started"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/25 transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              Get Started
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#0B1020] px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-text-muted"
            >
              <Search className="w-4 h-4" />
              <span>Search documentation...</span>
            </button>
            <div className="flex flex-col space-y-2 text-sm text-text-muted pt-2">
              <Link href="/product" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Product</Link>
              <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Features</Link>
              <Link href="/architecture" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Architecture</Link>
              <Link href="/use-cases" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Use Cases</Link>
              <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Documentation</Link>
              <Link href="/performance" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Performance</Link>
              <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Security</Link>
              <Link href="/roadmap" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-text">Roadmap</Link>
              <Link href="/docs/getting-started" onClick={() => setMobileMenuOpen(false)} className="py-2 text-primary-light font-semibold">Get Started Guide →</Link>
            </div>
          </div>
        )}
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
