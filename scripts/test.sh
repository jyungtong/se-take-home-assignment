#!/bin/bash

# Unit Test Script

set -e

echo "Running unit tests..."

npm ci
npm test

echo "Unit tests completed"
