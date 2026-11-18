#!/bin/sh
set -eu
A=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
python "$A/rollback.py" "${1:?Explicit isolated rollback-copy directory required}"
