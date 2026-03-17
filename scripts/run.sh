#!/bin/bash

# Run Script
# Executes the CLI simulation and writes results to scripts/result.txt

set -e

echo "Running CLI application..."

npx tsx src/index.ts

echo "CLI application execution completed"
