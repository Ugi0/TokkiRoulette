#!/usr/bin/env bash
#
# Compares the live database schema with the schema that db-init.sql creates.
#
# It starts a throwaway Postgres container from the *same image* as the live database,
# loads db-init.sql into it, dumps both schemas with pg_dump and diffs them.
# The live database is only read (pg_dump --schema-only); nothing is changed.
#
# Usage (on the host running the database container):
#   backend/scripts/compare-schema.sh
#   DB_CONTAINER=roulette-db OUT_DIR=./schema-check backend/scripts/compare-schema.sh
#
# Exit code 0 = schemas match, 1 = differences found (see schema.diff), 2 = the check itself failed.

set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-roulette-db}"
CHECK_CONTAINER="roulette-schema-check-$$"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SQL="$(cd "$SCRIPT_DIR/.." && pwd)/db-init.sql"
OUT_DIR="${OUT_DIR:-$(mktemp -d)}"
mkdir -p "$OUT_DIR"

fail() { echo "ERROR: $*" >&2; exit 2; }

[ -f "$INIT_SQL" ] || fail "db-init.sql not found at $INIT_SQL"
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || fail "container '$DB_CONTAINER' not found (set DB_CONTAINER)"

cleanup() { docker rm -f "$CHECK_CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

# Same image ID as the live database, so both dumps come from the same pg_dump version.
IMAGE_ID="$(docker inspect --format '{{.Image}}' "$DB_CONTAINER")"
DB_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER)"
DB_NAME="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB)"

echo "Starting a temporary database from db-init.sql..."
docker run -d --name "$CHECK_CONTAINER" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_DB="$DB_NAME" \
  -e POSTGRES_PASSWORD=schema-check \
  -v "$INIT_SQL:/docker-entrypoint-initdb.d/db-init.sql:ro" \
  "$IMAGE_ID" >/dev/null

# Wait until the entrypoint has run db-init.sql and restarted the server.
for _ in $(seq 1 60); do
  if [ "$(docker inspect --format '{{.State.Running}}' "$CHECK_CONTAINER")" != "true" ]; then
    docker logs "$CHECK_CONTAINER" >&2 || true
    fail "temporary database stopped; db-init.sql probably failed (log above)"
  fi
  if docker logs "$CHECK_CONTAINER" 2>&1 | grep -q "init process complete" \
     && docker exec "$CHECK_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$CHECK_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 \
  || fail "temporary database did not become ready in time"

dump() {
  docker exec "$1" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema-only --no-owner --no-privileges'
}

# Drop comments, session settings, blank lines and the random-keyed \restrict lines newer pg_dumps emit.
normalize() {
  sed -E '/^--/d; /^SET /d; /^SELECT pg_catalog\.set_config/d; /^\\(un)?restrict /d; /^[[:space:]]*$/d'
}

dump "$DB_CONTAINER" | normalize > "$OUT_DIR/live-schema.sql"
dump "$CHECK_CONTAINER" | normalize > "$OUT_DIR/expected-schema.sql"

if diff -u "$OUT_DIR/expected-schema.sql" "$OUT_DIR/live-schema.sql" > "$OUT_DIR/schema.diff"; then
  echo "OK: the live schema matches db-init.sql."
  rm -f "$OUT_DIR/schema.diff"
  exit 0
fi

echo "DIFFERENCES FOUND. Lines starting with '-' are expected but missing/different in the live database,"
echo "lines starting with '+' exist only in the live database."
echo
cat "$OUT_DIR/schema.diff"
echo
echo "Saved: $OUT_DIR/schema.diff (full dumps: expected-schema.sql, live-schema.sql)"
exit 1
