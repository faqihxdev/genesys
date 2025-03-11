#!/bin/bash
# run.sh

JS_FILE=$1  # Get the JS file passed as an argument

if [ -z "$JS_FILE" ]; then
  echo "No JS file provided!"
  exit 1
fi

node --env-file=../.env $JS_FILE