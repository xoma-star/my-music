#!/bin/sh
set -e

if [ -n "$CACHE_DIR" ]; then
  mkdir -p "$CACHE_DIR"
  chown -R nextjs:nodejs "$CACHE_DIR"
fi

exec su-exec nextjs "$@"
