#!/bin/sh
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
python "$here/rollback.py" "${1:?Pass rollback target directory}"
