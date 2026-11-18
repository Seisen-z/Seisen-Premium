#!/bin/sh
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
python "$here/rollback.py" "${1:?Pass website target directory}" "${2:?Pass library target file}"
