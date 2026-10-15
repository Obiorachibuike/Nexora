#!/usr/bin/env bash
set -euo pipefail

echo "Executing Nexora Performance Benchmark..."
node benchmarks/run_benchmarks.js
