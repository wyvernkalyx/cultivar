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

# run_status <fallback> <fn>: like run_or, but also prints the exit status.
# Required wherever an absence gate runs on a grep that can die: a SIGABRT
# (exit 134) is indistinguishable from a clean zero-hit without the code.
# Note the two-step local assignment -- `local out="$(cmd)"` would report
# local's exit (0), silently swallowing a 134.
run_status() {
  local fallback="$1"; shift
  printf '$ %s\n' "$*"
  local out status
  out="$("$@")"; status=$?
  if [ -z "$out" ]; then printf '%s\n' "$fallback"; else printf '%s\n' "$out"; fi
  echo "exit: $status"
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
# count_lib is an absence gate: tracked files under a repo-root lib/ -- a wrong
# landing spot for client code, which lives at src/lib/. Expected 0.
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

echo '=== [11] deno check: ingest-coa (success is silent; exit status printed) ==='
deno_check() { deno check --config supabase/functions/deno.json supabase/functions/ingest-coa/index.ts 2>&1; }
run_status '(no output)' deno_check
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

echo '=== [13] expo lint (exit status printed) ==='
expo_lint() ( set -o pipefail; npx expo lint 2>&1 | tail -14 )
run_status '(no output)' expo_lint
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

echo '=== [16] migrations (name-form count + newest) ==='
migration_count() ( set -o pipefail; ls supabase/migrations/ | grep -Ec '^[0-9]{14}_' )
run_status '(none)' migration_count
migration_newest() ( set -o pipefail; ls supabase/migrations/ | grep -E '^[0-9]{14}_' | sort | tail -1 )
run_status '(none)' migration_newest
echo

echo '=== [17] D85 client state (lexicon version, spark absence, main_goal count) ==='
lexicon_line() { grep -n "LEXICON_VERSION = " src/lib/lexicon.ts; }
run_status '(none)' lexicon_line
spark_scan() { grep -rn -i "spark" src/; }
run_status '(none)' spark_scan
main_goal_count() { grep -c "main_goal" src/components/session-ladder.tsx; }
run_status '(none)' main_goal_count
echo

echo '=== [18] checkbox fix (drawn check present, glyph forms absent) ==='
checkmark_count() { grep -c "checkMark" src/components/session-ladder.tsx; }
run_status '(none)' checkmark_count
checkglyph_count() { grep -c "checkGlyph" src/components/session-ladder.tsx; }
run_status '(none)' checkglyph_count
u2713_count() { grep -c "✓" src/components/session-ladder.tsx; }
run_status '(none)' u2713_count
echo

echo '=== [19] MANUAL: run in the Supabase SQL editor ==='
cat <<'SQL'
select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;
select tablename, policyname, cmd from pg_policies where schemaname='public' order by 1,2;
select c.relname as view,
       unnest(coalesce(c.reloptions, array['(none)'])) as reloption
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by 1, 2;
select table_name, grantee, count(*) as priv_count
from information_schema.role_table_grants
where table_schema='public' and table_name in ('session_current','coa_session_stats')
group by 1,2 order by 1,2;
select column_name from information_schema.columns
where table_schema='public' and table_name='session_entries'
and column_name in ('main_goal','spark');
SQL
echo
echo 'Note: the SQL editor runs privileged, so RLS does not apply to its queries and'
echo 'select count(*) cannot distinguish a table with RLS on from one with it'
echo 'silently off. pg_policies is the observation the schema gate actually requires.'
echo 'View reloptions is the invocation the schema gate requires; pg_policies never'
echo 'shows it -- a security_invoker=true view is only provable in the third query.'
echo 'The grants query exists because pg_policies never shows view grants. The'
echo 'IN-list query proves the D85 rename at schema level in one output.'
