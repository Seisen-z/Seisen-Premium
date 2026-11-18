#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
[ "$#" -eq 1 ] || { echo 'Usage: ROLLBACK.sh TARGET_ROOT' >&2; exit 2; }
python "$HERE/rollback.py" "$1"
