export interface NavItem {
  title: string;
  href: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const DOCS_NAV: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Overview', href: '/docs' },
      { title: 'Quickstart Guide', href: '/docs/getting-started', badge: '5 min' },
      { title: 'Installation & Binary', href: '/docs/installation' },
      { title: 'Configuration Reference', href: '/docs/configuration' },
    ],
  },
  {
    title: 'Storage & Caching',
    items: [
      { title: 'Append-Only Storage Engine', href: '/docs/storage', badge: 'AOF' },
      { title: 'Hot Cache & Eviction', href: '/docs/cache' },
    ],
  },
  {
    title: 'Queues & Workers',
    items: [
      { title: 'Durable Background Queues', href: '/docs/queues' },
      { title: 'Workers, Leases & Fencing', href: '/docs/workers' },
      { title: 'Exponential Retries & DLQ', href: '/docs/retries' },
      { title: 'Delayed Jobs', href: '/docs/delayed-jobs' },
    ],
  },
  {
    title: 'Events & Scheduler',
    items: [
      { title: 'Event Broker & Consumer Groups', href: '/docs/events' },
      { title: 'Recurring Cron & Interval Scheduler', href: '/docs/scheduling' },
    ],
  },
  {
    title: 'Language SDKs',
    items: [
      { title: 'TypeScript / Node.js', href: '/docs/sdks/typescript', badge: 'Primary' },
      { title: 'Python', href: '/docs/sdks/python', badge: 'Primary' },
      { title: 'Go', href: '/docs/sdks/go' },
      { title: 'Rust', href: '/docs/sdks/rust' },
      { title: 'Java & Kotlin', href: '/docs/sdks/java' },
      { title: 'C# / .NET', href: '/docs/sdks/csharp' },
      { title: 'C / C++', href: '/docs/sdks/cpp' },
      { title: 'All 20 SDKs Catalog', href: '/product' },
    ],
  },
  {
    title: 'Operations & Reference',
    items: [
      { title: 'Wire Protocol Specification', href: '/docs/protocol', badge: 'NBP/1.0' },
      { title: 'Security & Access Control', href: '/docs/security' },
      { title: 'Observability & Metrics', href: '/docs/observability' },
      { title: 'Production Deployment', href: '/docs/deployment' },
      { title: 'Troubleshooting Guide', href: '/docs/troubleshooting' },
      { title: 'Frequently Asked Questions', href: '/docs/faq' },
    ],
  },
];
