#!/bin/bash

# Run Script
# Executes the CLI simulation and writes results to scripts/result.txt

set -e

echo "Running CLI application..."

node src/index.js

echo "CLI application execution completed"
