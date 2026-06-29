#!/usr/bin/env bash
# End-to-end test against the real TickTick/Dida365 account.
# Requires: ./tock built, authenticated (tock init), jq installed.
# Creates a uniquely-named task, exercises update/complete-path invariants,
# deletes it, and verifies the list returns to its original state.
#
# NOTE: pipe tock's JSON straight into jq or use printf '%s' — zsh's echo
# mangles \uXXXX escapes in JSON.
set -uo pipefail
cd "$(dirname "$0")/.."

TOCK=./tock
T="tock-e2e-$$"
pass=0; fail=0
check() { # name got want
  if [ "$2" = "$3" ]; then echo "  ✅ $1 ($2)"; pass=$((pass+1));
  else echo "  ❌ $1: got [$2] want [$3]"; fail=$((fail+1)); fi
}

echo "0) liveness + baseline count"
baseline=$($TOCK task list -o json | jq 'length') || { echo "❌ liveness failed"; exit 1; }
echo "   baseline tasks: $baseline"

echo "1) CREATE  title=$T content=orig tags=e2e"
id=$($TOCK task create -t "$T" -c "orig" --tags e2e | awk '{print $3}')
[ -n "$id" ] || { echo "❌ create returned no id"; exit 1; }
echo "   -> id=$id"

echo "2) initial state"
j=$($TOCK task show "$id" -o json)
check "title"   "$(printf '%s' "$j" | jq -r .title)"      "$T"
check "content" "$(printf '%s' "$j" | jq -r .content)"    "orig"
check "tag[0]"  "$(printf '%s' "$j" | jq -r '.tags[0]')"  "e2e"

echo "3) UPDATE title+priority only (content/tags untouched)"
$TOCK task update "$id" -t "$T-renamed" -p high >/dev/null

echo "4) post-update assertions"
j=$($TOCK task show "$id" -o json)
check "title changed"     "$(printf '%s' "$j" | jq -r .title)"     "$T-renamed"
check "priority changed"  "$(printf '%s' "$j" | jq -r .priority)"  "5"
check "content preserved" "$(printf '%s' "$j" | jq -r .content)"   "orig"
check "tags preserved"    "$(printf '%s' "$j" | jq -r '.tags[0]')" "e2e"

echo "5) no-duplicate invariant"
l=$($TOCK task list -o json)
check "renamed count"  "$(printf '%s' "$l" | jq "[.[]|select(.title==\"$T-renamed\")]|length")" "1"
check "old-title count" "$(printf '%s' "$l" | jq "[.[]|select(.title==\"$T\")]|length")" "0"
check "total = baseline+1" "$(printf '%s' "$l" | jq 'length')" "$((baseline+1))"

echo "6) empty update is rejected"
if $TOCK task update "$id" >/dev/null 2>&1; then
  check "empty update exits non-zero" "0" "1"
else
  check "empty update exits non-zero" "1" "1"
fi

echo "7) COMPLETE then DELETE"
$TOCK task complete "$id" >/dev/null
check "complete ok" "$?" "0"
$TOCK task delete "$id" >/dev/null
check "delete ok" "$?" "0"
final=$($TOCK task list -o json | jq 'length')
check "back to baseline" "$final" "$baseline"

echo ""
echo "=== result: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ] && echo "🎉 e2e PASSED" || { echo "⚠️ e2e FAILED"; exit 1; }
