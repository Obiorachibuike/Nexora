#!/usr/bin/env bash
set -euo pipefail

echo "======================================================"
echo "          RUNNING COMPLETE NEXORA TEST SUITE          "
echo "======================================================"

echo "1. Storage Persistence & Server Restart Recovery Test:"
node tests/integration/phase1_persistence_restart.test.js

echo "2. Torn-Write Power Loss Simulation & Truncation Test:"
node tests/recovery/torn_write_recovery.test.js

echo "3. Durable Queue, Priorities & Worker Leases Test:"
node tests/integration/phase2_queue_workers.test.js

echo "4. Event Messaging, Consumer Groups & Scheduler Test:"
node tests/integration/phase4_events_scheduler.test.js

echo "5. Shared 10-Point SDK Conformance Suite:"
node tests/conformance/cross_sdk_conformance.test.js

echo "6. Website Documentation & Page Integrity Tests:"
(cd website && npm test)

echo ""
echo "======================================================"
echo "       ALL NEXORA SUITES COMPLETED SUCCESSFULLY!      "
echo "======================================================"
