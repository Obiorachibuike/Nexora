import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Nexora — Powering the Next Generation of Applications',
  description: 'Independent infrastructure engine combining persistent background jobs, key-value storage, caching, event messaging, and scheduling into one server with official SDKs for 20 languages.',
  keywords: ['infrastructure', 'background queue', 'job queue', 'key-value store', 'cache', 'event messaging', 'scheduler', 'rust'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-background text-text flex flex-col font-sans antialiased selection:bg-primary/30 selection:text-white">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
