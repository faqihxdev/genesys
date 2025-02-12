#!/bin/bash

# Warn the user about suppressed deprecation warnings
echo "==============================="
echo "WARNING: This script runs with deprecation warnings suppressed. If you want to see deprecation warnings, please use 'pnpm dev' instead."
echo "==============================="

# Suppress deprecation warnings by setting the environment variable
export NODE_NO_WARNINGS=1

# Run the development server
pnpm run dev
