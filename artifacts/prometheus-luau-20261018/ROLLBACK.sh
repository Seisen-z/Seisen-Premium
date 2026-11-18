#!/bin/sh
set -eu
DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
python "$DIR/rollback.py" "${1:-$DIR/../..}"
