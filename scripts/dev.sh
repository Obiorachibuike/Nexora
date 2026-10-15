#!/usr/bin/env bash
set -euo pipefail

echo "Starting Nexora local development environment..."
./bin/nexora-server.js --bind 127.0.0.1 --port 6380 --http-port 6381 --data-dir ./data
