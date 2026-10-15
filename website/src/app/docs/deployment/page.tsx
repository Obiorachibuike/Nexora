import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Production Deployment — Nexora Docs',
  description: 'Deploying Nexora to production Linux servers, systemd configuration, and file descriptor limits.',
};

export default function DeploymentDocsPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Deployment
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Production Deployment Runbook
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Best practices for running Nexora in high-reliability single-node production environments.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. Operating System Configuration</h2>
          <p className="mb-2">Ensure file descriptor limits are elevated for high concurrent socket counts:</p>
          <CodeBlock
            code={`# /etc/security/limits.conf\nnexora soft nofile 65536\nnexora hard nofile 65536`}
            language="bash"
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. Data Volume Placement</h2>
          <p>
            Place your <code>data_dir</code> on an NVMe SSD or persistent block storage volume.
            Avoid mounting network filesystems (NFS) with unstable write caching for append-only logs.
          </p>
        </section>
      </div>
    </DocsLayout>
  );
}
