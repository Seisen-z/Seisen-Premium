#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ "${1:-}" = "--live" ]; then
  cd "$HERE/../.."
  exec node --env-file=.env.local "$HERE/import.mjs" rollback-live
fi
: "${1:?Provide an explicit separate JSON target, or --live to restore Supabase}"
cp -- "$HERE/BASELINE_FILE.json" "$1"
node "$HERE/import.mjs" rollback-check "$1"
