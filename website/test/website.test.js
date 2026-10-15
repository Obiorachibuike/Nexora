const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const APP_DIR = path.resolve(__dirname, '../.next/server/app');

test('Website Build Integrity', async (t) => {
  // Ensure Next.js build has run
  if (!fs.existsSync(APP_DIR)) {
    console.log('Building Next.js site before testing...');
    execSync('npm run build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  }

  await t.test('Core pages generated successfully', () => {
    const corePages = [
      'index.html',
      'product.html',
      'features.html',
      'architecture.html',
      'use-cases.html',
      'performance.html',
      'security.html',
      'roadmap.html',
      'about.html',
      'docs.html',
      'docs/getting-started.html',
      'docs/installation.html',
      'docs/configuration.html',
      'docs/protocol.html',
      'docs/storage.html',
      'docs/cache.html',
      'docs/queues.html',
      'docs/workers.html',
      'docs/retries.html',
      'docs/delayed-jobs.html',
      'docs/scheduling.html',
      'docs/events.html',
      'docs/security.html',
      'docs/observability.html',
      'docs/deployment.html',
      'docs/troubleshooting.html',
      'docs/faq.html',
    ];

    for (const page of corePages) {
      const filePath = path.join(APP_DIR, page);
      assert(fs.existsSync(filePath), `Generated page must exist: ${page}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert(content.length > 500, `Page content must not be empty: ${page}`);
    }
  });

  await t.test('All 20 SDK documentation pages generated', () => {
    const sdks = [
      'typescript', 'javascript', 'python', 'go', 'rust',
      'cpp', 'c', 'java', 'csharp', 'php',
      'ruby', 'kotlin', 'swift', 'dart', 'elixir',
      'scala', 'r', 'julia', 'lua', 'perl'
    ];

    for (const slug of sdks) {
      const filePath = path.join(APP_DIR, `docs/sdks/${slug}.html`);
      assert(fs.existsSync(filePath), `SDK doc page must exist for: ${slug}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert(content.includes('SDK'), `Page must contain SDK header for: ${slug}`);
      assert(content.includes('Installation'), `Page must contain installation section for: ${slug}`);
    }
  });

  await t.test('Homepage contains brand hero, capabilities, and navigation links', () => {
    const homeHtml = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf-8');
    assert(homeHtml.includes('One Engine. Twenty Languages.'), 'Hero headline present');
    assert(homeHtml.includes('Persistent Storage'), 'Persistent Storage card present');
    assert(homeHtml.includes('Background Queues'), 'Background Queues card present');
    assert(homeHtml.includes('High-Performance Cache'), 'Cache card present');
    assert(homeHtml.includes('Event Messaging'), 'Event Messaging card present');
    assert(homeHtml.includes('Job Scheduling'), 'Job Scheduling card present');
    assert(homeHtml.includes('Worker Coordination'), 'Worker Coordination card present');
  });
});
