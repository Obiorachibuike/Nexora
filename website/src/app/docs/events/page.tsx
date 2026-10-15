import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Event Messaging & Topics — Nexora Docs',
  description: 'Pub/sub topics, consumer groups, and sequence numbers in Nexora.',
};

export default function EventsDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Messaging
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Event Messaging & Topics
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Decouple your microservices using Nexora&apos;s independent pub/sub event broker with consumer group offsets.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Publishing & Consuming Events</h2>
          <CodeBlock
            code={`// 1. Publisher
await events.publish("user.registered", {
  userId: "usr_1092",
  email: "ada@example.com"
});

// 2. Consumer Group Subscriber
const eventsList = await events.poll("user.registered", "analytics-team", 10);
for (const ev of eventsList) {
  await recordAnalytics(ev.payload);
  await events.ack("user.registered", "analytics-team", ev.id);
}`}
            language="typescript"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
