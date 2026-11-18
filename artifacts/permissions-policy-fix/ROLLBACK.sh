#!/usr/bin/env sh
set -eu
artifact_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
target=${1:-"$artifact_dir/../rollback-target.ts"}
cp "$artifact_dir/ORIGINAL_FILE.ts" "$target"
printf 'ROLLBACK_RESULT=restored %s\n' "$target"