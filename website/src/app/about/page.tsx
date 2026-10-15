import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'About Nexora — Powering Next-Gen Applications',
  description: 'The mission, values, and engineering principles behind the Nexora project.',
};

export default function AboutPage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
        About Nexora
      </span>
      <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2 sm:text-5xl">
        Powering the Next Generation of Applications
      </h1>

      <div className="mt-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <p>
          Nexora is an independent infrastructure engine designed to unify background queues, key-value storage, caching, event messaging, and scheduling into one single server.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">Why We Built Nexora</h2>
        <p>
          Every modern production backend inevitably needs background job processing, caching, and scheduling.
          For the past decade, the industry standard has been to cobble together multiple independent tools: a Redis instance for caching, a BullMQ or Celery worker fleet for jobs, a cron daemon for scheduling, and RabbitMQ or Kafka for messaging.
        </p>
        <p>
          This &ldquo;Frankenstein stack&rdquo; creates severe operational complexity: fragmented monitoring, disparate connection pooling, inconsistent serialization bugs, and cascading failover headaches.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">Our Core Engineering Principles</h2>
        <ul className="space-y-3 pl-4 list-disc marker:text-primary">
          <li>
            <strong className="text-white">Independent Implementation:</strong> Nexora is not a wrapper around Redis or any existing queue engine. It owns its storage, protocol, and runtime.
          </li>
          <li>
            <strong className="text-white">Durability First:</strong> Data correctness and crash recovery come before speculative throughput claims.
          </li>
          <li>
            <strong className="text-white">Equal 20-Language Citizenry:</strong> Official SDKs exist for 20 programming languages, all communicating over the exact same binary wire protocol without second-class wrappers.
          </li>
          <li>
            <strong className="text-white">Zero External Bloat:</strong> Runs as a self-contained single binary without requiring external databases or Docker containers to function.
          </li>
        </ul>
      </div>
    </div>
  );
}
