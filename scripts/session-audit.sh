#!/usr/bin/env bash
#
# Phase A session audit. It prints the read-only evidence whose expected values
# live in documentation/SESSION_HANDOFF.md — raw command output under labelled
# headers, never a verdict; judgment stays with the reader. Run it from the
# repo root: bash scripts/session-audit.sh

echo '=== [1] current branch ==='
echo '$ git rev-parse --abbrev-ref HEAD'
git rev-parse --abbrev-ref HEAD
echo

echo '=== [2] HEAD ==='
echo "\$ git log -1 --format='%h %p %s'"
git log -1 --format='%h %p %s'
echo

echo '=== [3] commits ahead of origin/main ==='
echo '$ git fetch origin'
git fetch origin
echo '$ git rev-list --count origin/main..HEAD'
git rev-list --count origin/main..HEAD
echo

echo '=== [4] working tree ==='
echo '$ git status --short'
out="$(git status --short)"
if [ -z "$out" ]; then
  echo '(clean)'
else
  printf '%s\n' "$out"
fi
echo

echo '=== [5] has .env ever been committed ==='
echo "\$ git log --all --full-history --oneline -- ':/.env'"
out="$(git log --all --full-history --oneline -- ':/.env')"
if [ -z "$out" ]; then
  echo '(never committed)'
else
  printf '%s\n' "$out"
fi
echo

echo '=== [6] client path (index, not worktree) ==='
echo '$ git ls-files src/lib/supabase.ts'
out="$(git ls-files src/lib/supabase.ts)"
if [ -z "$out" ]; then
  echo '(not tracked)'
else
  printf '%s\n' "$out"
fi
echo '$ git ls-files -- lib/ | wc -l'
git ls-files -- lib/ | wc -l
echo

echo '=== [7a] .gitignore blob at HEAD, numbered ==='
echo '$ git show HEAD:.gitignore | cat -n'
git show HEAD:.gitignore | cat -n
echo

echo '=== [7b] .gitignore blob at HEAD, line endings visible ==='
echo '$ git show HEAD:.gitignore | cat -A'
git show HEAD:.gitignore | cat -A
echo

echo '=== [8] unstable flags ==='
echo '$ grep -rn "unstable" supabase/ deno.json 2>/dev/null | grep -v node_modules'
out="$(grep -rn "unstable" supabase/ deno.json 2>/dev/null | grep -v node_modules)"
if [ -z "$out" ]; then
  echo '(none)'
else
  printf '%s\n' "$out"
fi
echo

echo '=== [9] npm test ==='
echo '$ npm test 2>&1 | tail -8'
npm test 2>&1 | tail -8
echo

echo '=== [10] deno test: ingest-coa ==='
echo '$ deno test --allow-read --config supabase/functions/deno.json supabase/functions/ingest-coa/__tests__/ingestCoa.test.ts 2>&1 | tail -5'
deno test --allow-read --config supabase/functions/deno.json supabase/functions/ingest-coa/__tests__/ingestCoa.test.ts 2>&1 | tail -5
echo

echo '=== [11] deno check: ingest-coa ==='
echo '$ deno check --config supabase/functions/deno.json supabase/functions/ingest-coa/index.ts 2>&1'
deno check --config supabase/functions/deno.json supabase/functions/ingest-coa/index.ts 2>&1
echo

echo '=== [12] tsc (success is silent; exit status printed) ==='
echo '$ npx tsc --noEmit 2>&1 | tail -3'
out="$(npx tsc --noEmit 2>&1)"
status=$?
if [ -z "$out" ]; then
  echo '(no output)'
else
  printf '%s\n' "$out" | tail -3
fi
echo "exit status: $status"
echo

echo '=== [13] expo lint ==='
echo '$ npx expo lint 2>&1 | tail -14'
npx expo lint 2>&1 | tail -14
echo

echo '=== [14] expo install --check (expected: jest and @types/jest misaligned. Do not fix.) ==='
echo '$ npx expo install --check 2>&1 | tail -6'
npx expo install --check 2>&1 | tail -6
echo

echo '=== [15] trailers on HEAD (parsed, not counted) ==='
echo '$ git log -1 --format=%B | git interpret-trailers --parse'
git log -1 --format=%B | git interpret-trailers --parse
echo

echo '=== MANUAL: run in the Supabase SQL editor ==='
cat <<'SQL'
select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;
select tablename, policyname, cmd from pg_policies where schemaname='public' order by 1,2;
SQL
echo
echo 'Note: the SQL editor runs privileged, so RLS does not apply to its queries and'
echo 'select count(*) cannot distinguish a table with RLS on from one with it'
echo 'silently off. pg_policies is the observation the schema gate actually requires.'
