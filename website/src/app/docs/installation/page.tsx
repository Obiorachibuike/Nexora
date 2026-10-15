import React from 'react';
import { DocsLayout } from '../../../components/DocsLayout';
import { CodeBlock } from '../../../components/CodeBlock';

export const metadata = {
  title: 'Installation Options — Nexora Docs',
  description: 'How to install and run the Nexora infrastructure server across Linux, macOS, and container environments.',
};

export default function InstallationPage() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Installation
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Installing & Deploying Nexora
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Nexora is distributed as a standalone binary executable with zero external database dependencies.
        </p>
      </div>

      <div className="space-y-8 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">Option A: Direct Executable Running</h2>
          <p className="mb-3">
            Clone the repository or download the prebuilt binary from releases:
          </p>
          <CodeBlock
            code={`git clone https://github.com/Obiorachibuike/Nexora.git\ncd Nexora\n./bin/nexora-server.js --port 6380`}
            language="bash"
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Option B: Docker Container</h2>
          <p className="mb-3">
            Run Nexora inside a container with a mounted volume for persistent log storage:
          </p>
          <CodeBlock
            code={`docker run -d \\\n  --name nexora \\\n  -p 6380:6380 \\\n  -p 6381:6381 \\\n  -v $(pwd)/data:/data \\\n  nexora/server:latest`}
            language="bash"
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">Option C: Systemd Service (Linux Production)</h2>
          <p className="mb-3">
            To manage Nexora as a background system daemon on Ubuntu / Debian / RHEL:
          </p>
          <CodeBlock
            code={`[Unit]\nDescription=Nexora Infrastructure Engine\nAfter=network.target\n\n[Service]\nType=simple\nUser=nexora\nExecStart=/usr/local/bin/nexora-server --port 6380 --data-dir /var/lib/nexora\nRestart=always\nRestartSec=3\nLimitNOFILE=65536\n\n[Install]\nWantedBy=multi-user.target`}
            language="ini"
            filename="/etc/systemd/system/nexora.service"
          />
        </section>
      </div>
    </DocsLayout>
  );
}
