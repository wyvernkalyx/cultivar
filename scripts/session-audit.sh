#!/usr/bin/env bash
#
# Phase A session audit. It prints the read-only evidence whose expected values
# live in documentation/SESSION_HANDOFF.md -- raw command output under labelled
# headers, never a verdict; judgment stays with the reader. Run it from the
# repo root: bash scripts/session-audit.sh
#
# Echo-drift invariant: every displayed `$ ...` line is produced by printf from
# the argv (or named function) that then executes. A hand-echoed command that
# drifts from what actually runs is the defect class this script forbids. Where
# a section needs a pipeline or a redirection -- neither of which survives an
# argv array -- it is wrapped in a named function and that function name is what
# both prints and runs, so the display still names the executed code.

# run <argv...>: display the exact argv as a `$ ` line, then execute it.
run() { printf '$ %s\n' "$*"; "$@"; }

# run_or <fallback> <argv...>: like run, but when the command emits no stdout,
# print <fallback> in its place (the "(clean)"/"(none)"/... sentinels).
run_or() {
  local fallback="$1"; shift
  printf '$ %s\n' "$*"
  local out; out="$("$@")"
  if [ -z "$out" ]; then printf '%s\n' "$fallback"; else printf '%s\n' "$out"; fi
}

echo '=== [1] current branch ==='
run git rev-parse --abbrev-ref HEAD
echo

echo '=== [2] HEAD ==='
run git log -1 --format='%h %p %s'
echo

echo '=== [3] commits behind/ahead of origin/main ==='
run git fetch origin
run git rev-list --left-right --count origin/main...HEAD
echo

echo '=== [4] working tree ==='
run_or '(clean)' git status --short
echo

echo '=== [5] has .env ever been committed ==='
run_or '(never committed)' git log --all --full-history --oneline -- ':/.env'
echo

echo '=== [6] client path (index, not worktree) ==='
run_or '(not tracked)' git ls-files src/lib/supabase.ts
count_lib() { git ls-files -- lib/ | wc -l; }
run count_lib
echo

echo '=== [7a] .gitignore blob at HEAD, numbered ==='
gitignore_numbered() { git show HEAD:.gitignore | cat -n; }
run gitignore_numbered
echo

echo '=== [7b] .gitignore blob at HEAD, line endings visible ==='
gitignore_endings() { git show HEAD:.gitignore | cat -A; }
run gitignore_endings
echo

echo '=== [8] unstable flags ==='
# Named so the pipeline that runs is the pipeline that shows. The subshell body
# localises pipefail so `grep exit` reflects a failure anywhere in the chain --
# a dead grep (SIGABRT 134) must stay distinguishable from a clean zero-hit (1).
unstable_scan() ( set -o pipefail; grep -rn 'unstable' supabase/ deno.json 2>/dev/null | grep -v node_modules )
printf '$ %s\n' 'unstable_scan'
out="$(unstable_scan)"; grep_status=$?
if [ -z "$out" ]; then echo '(none)'; else printf '%s\n' "$out"; fi
echo "grep exit: $grep_status"
echo

echo '=== [9] npm test ==='
jest_tail() { npm test 2>&1 | tail -8; }
run jest_tail
echo

echo '=== [10] deno test: ingest-coa ==='
deno_test_tail() { deno test --allow-read --config supabase/functions/deno.json supabase/functions/ingest-coa/__tests__/ingestCoa.test.ts 2>&1 | tail -5; }
run deno_test_tail
echo

echo '=== [11] deno check: ingest-coa ==='
deno_check() { deno check --config supabase/functions/deno.json supabase/functions/ingest-coa/index.ts 2>&1; }
run deno_check
echo

echo '=== [12] tsc (success is silent; exit status printed) ==='
if [ ! -x node_modules/typescript/bin/tsc ]; then
  echo 'TSC ABSENT -- false gate, do not trust a silent pass'
fi
tsc_check() { npx tsc --noEmit 2>&1; }
printf '$ %s\n' 'tsc_check'
out="$(tsc_check)"; status=$?
if [ -z "$out" ]; then echo '(no output)'; else printf '%s\n' "$out" | tail -3; fi
echo "exit status: $status"
echo

echo '=== [13] expo lint ==='
expo_lint() { npx expo lint 2>&1 | tail -14; }
run expo_lint
echo

echo '=== [14] expo install --check (drift beyond jest/@types/jest is expected from expo patch releases; do not fix any of it) ==='
# stdin from /dev/null so a prompt can never make this section go interactive.
expo_check() { npx expo install --check </dev/null 2>&1 | tail -8; }
run expo_check
echo

echo '=== [15] trailers on HEAD (parsed, not counted) ==='
trailers() { git log -1 --format=%B | git interpret-trailers --parse; }
run trailers
echo

echo '=== [16] MANUAL: run in the Supabase SQL editor ==='
cat <<'SQL'
select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;
select tablename, policyname, cmd from pg_policies where schemaname='public' order by 1,2;
select c.relname as view,
       unnest(coalesce(c.reloptions, array['(none)'])) as reloption
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by 1, 2;
SQL
echo
echo 'Note: the SQL editor runs privileged, so RLS does not apply to its queries and'
echo 'select count(*) cannot distinguish a table with RLS on from one with it'
echo 'silently off. pg_policies is the observation the schema gate actually requires.'
echo 'View reloptions is the invocation the schema gate requires; pg_policies never'
echo 'shows it -- a security_invoker=true view is only provable in the third query.'
