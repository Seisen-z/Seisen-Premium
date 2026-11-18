#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET=${1:?Usage: ROLLBACK.sh TARGET_FILE}
cp "$SCRIPT_DIR/ORIGINAL_FILE.tsx" "$TARGET"
printf 'ROLLBACK_OK %s\n' "$TARGET"
