#!/usr/bin/env sh
set -eu
input="${1:?usage: ./ROLLBACK.sh INPUT_COPY.tsx}"
rollback_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cp "$rollback_dir/BASELINE_FILE.tsx" "$input"
echo "RESTORED: $input"