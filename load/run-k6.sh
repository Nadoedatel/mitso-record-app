#!/bin/sh
# Runs a k6 script from load/k6: with the local k6 if it is installed, otherwise in the grafana/k6 docker image.
# Usage: load/run-k6.sh scenarios.js   (or smoke.js)
# BASE_URL defaults to the backend on this machine; from inside docker that is host.docker.internal.
set -eu
cd "$(dirname "$0")"
script="${1:-scenarios.js}"

if command -v k6 >/dev/null 2>&1; then
  BASE_URL="${BASE_URL:-http://localhost:8080}" exec k6 run "k6/$script"
fi

exec docker run --rm -i \
  -e BASE_URL="${BASE_URL:-http://host.docker.internal:8080}" \
  -v "$PWD/k6:/scripts:ro" \
  grafana/k6 run "/scripts/$script"
