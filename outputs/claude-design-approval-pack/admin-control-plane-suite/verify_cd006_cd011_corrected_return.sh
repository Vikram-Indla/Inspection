#!/bin/bash
set -u

# Read-only verifier for a corrected CD-006..CD-011 Claude Design return.
# Usage: bash verify_cd006_cd011_corrected_return.sh /absolute/path/to/corrected-return

root=${1:-}
failures=0

fail() {
  printf 'FAIL: %s\n' "$1"
  failures=$((failures + 1))
}

pass() {
  printf 'PASS: %s\n' "$1"
}

if [ -z "$root" ] || [ ! -d "$root" ]; then
  printf 'Usage: bash %s /absolute/path/to/corrected-return\n' "$0"
  exit 2
fi

required_audit_ids='AUD-P0-01 AUD-P0-02 AUD-P0-03A AUD-P0-03B AUD-P0-03C AUD-P0-03D AUD-P1-01 AUD-P1-02 AUD-P1-03 AUD-P1-04'
required_states='S01_POPULATED S02_LOADING S03_EMPTY S04_VALIDATION S05_UNAUTHORIZED S06_READ_ONLY S07_STALE S08_DEGRADED S09_RECOVERY'
required_wiring_columns='wiring_id state_or_action_id ui_trigger client_component route_server_action validation_guard canonical_transition table_rpc_provider exact_columns_or_payload rls_grant_role audit_event notification_side_effect success_result negative_partial_failure keyboard_focus_announcement automated_test runtime_evidence disposition blocker_owner'

closure="$root/CORRECTION_CLOSURE_MATRIX_CD006_CD011.csv"
discovery="$root/SOURCE_DISCOVERY_LOG_CD006_CD011.md"

if [ -s "$closure" ]; then
  pass 'closure matrix exists'
else
  fail 'missing CORRECTION_CLOSURE_MATRIX_CD006_CD011.csv'
fi

if [ -s "$discovery" ]; then
  pass 'source-discovery log exists'
else
  fail 'missing SOURCE_DISCOVERY_LOG_CD006_CD011.md'
fi

if [ -s "$closure" ]; then
  for id in $required_audit_ids; do
    if /usr/bin/grep -q "^$id," "$closure"; then
      status=$(/usr/bin/ruby -rcsv -e 'row = CSV.foreach(ARGV[0], headers: true).find { |r| r["finding_id"] == ARGV[1] }; print(row ? row["status"].to_s.strip : "")' "$closure" "$id")
      if [ "$status" = 'PASS' ]; then
        pass "$id closed"
      else
        fail "$id status is '${status:-missing}', expected PASS"
      fi
    else
      fail "$id missing from closure matrix"
    fi
  done
fi

check_dimensions() {
  file=$1
  expected=$2
  if [ ! -s "$file" ]; then
    fail "missing image $(/usr/bin/basename "$file")"
    return
  fi
  width=$(/usr/bin/sips -g pixelWidth "$file" 2>/dev/null | /usr/bin/awk '/pixelWidth/ {print $2}')
  height=$(/usr/bin/sips -g pixelHeight "$file" 2>/dev/null | /usr/bin/awk '/pixelHeight/ {print $2}')
  actual="${width}x${height}"
  if [ "$actual" = "$expected" ]; then
    pass "$(/usr/bin/basename "$file") is $expected"
  else
    fail "$(/usr/bin/basename "$file") is $actual, expected $expected"
  fi
}

for cd in 006 007 008 009 010 011; do
  case "$cd" in
    006) screen='SCR-ADM-011' ;;
    007) screen='SCR-ADM-020' ;;
    008) screen='SCR-ADM-030' ;;
    009) screen='SCR-ADM-031' ;;
    010) screen='SCR-ADM-040' ;;
    011) screen='SCR-ADM-041' ;;
  esac

  dir="$root/cd-$cd-r2"
  if [ ! -d "$dir" ]; then
    fail "missing directory cd-$cd-r2"
    continue
  fi
  pass "directory cd-$cd-r2 exists"

  required_files="ROUTE_RUNTIME_TRUTH_MEMO_CD-$cd.md CURRENT_SCREEN_CRITIQUE_CD-$cd.md DATA_TRUTH_LEDGER_CD-$cd.csv HYPOTHESIS_COMPARISON_CD-$cd.md EVIDENCE_MANIFEST_CD-$cd.csv STATE_MATRIX_CD-$cd.csv ACCESSIBILITY_KEYBOARD_SPEC_CD-$cd.md LOCALIZATION_INVENTORY_CD-$cd.csv RESEARCH_LEDGER_CD-$cd.csv COMPONENT_MAP_CD-$cd.csv IMPLEMENTATION_MANIFEST_CD-$cd.yaml WIRING_MAP_CD-$cd.csv ACCEPTANCE_CHECKLIST_CD-$cd.md CLAUDE_CODE_HANDOFF_CD-$cd.md"
  for name in $required_files; do
    if [ -s "$dir/$name" ]; then
      pass "cd-$cd-r2/$name"
    else
      fail "missing or empty cd-$cd-r2/$name"
    fi
  done

  prefix="CD-$cd_${screen}"
  check_dimensions "$dir/${prefix}_primary.png" '1440x1024'
  check_dimensions "$dir/${prefix}_outlier.png" '1440x1024'
  check_dimensions "$dir/${prefix}_ar_dark_1440.png" '1440x1024'
  check_dimensions "$dir/${prefix}_ar_light_1440.png" '1440x1024'
  check_dimensions "$dir/${prefix}_en_dark_1440.png" '1440x1024'
  check_dimensions "$dir/${prefix}_en_light_1440.png" '1440x1024'
  check_dimensions "$dir/${prefix}_constrained_1024x1366.png" '1024x1366'

  hard_states="$dir/${prefix}_hard_states.png"
  if [ -s "$hard_states" ]; then
    pass "$(/usr/bin/basename "$hard_states") exists"
  else
    fail "missing $(/usr/bin/basename "$hard_states")"
  fi

  state_matrix="$dir/STATE_MATRIX_CD-$cd.csv"
  if [ -s "$state_matrix" ]; then
    for state in $required_states; do
      if /usr/bin/grep -q "^$state," "$state_matrix"; then
        pass "CD-$cd state $state"
      else
        fail "CD-$cd missing state $state"
      fi
    done
  fi

  wiring="$dir/WIRING_MAP_CD-$cd.csv"
  if [ -s "$wiring" ]; then
    header=$(/usr/bin/head -1 "$wiring")
    for column in $required_wiring_columns; do
      if printf '%s\n' "$header" | /usr/bin/grep -Eq "(^|,)$column(,|$)"; then
        :
      else
        fail "CD-$cd wiring column missing: $column"
      fi
    done
  fi

  manifest="$dir/IMPLEMENTATION_MANIFEST_CD-$cd.yaml"
  if [ -s "$manifest" ]; then
    manifest_branch=$(/usr/bin/ruby -ryaml -e 'd = YAML.load_file(ARGV[0]); print d["source_branch"]' "$manifest" 2>/dev/null || true)
    manifest_commit=$(/usr/bin/ruby -ryaml -e 'd = YAML.load_file(ARGV[0]); print d["source_commit"]' "$manifest" 2>/dev/null || true)
    manifest_dirty=$(/usr/bin/ruby -ryaml -e 'd = YAML.load_file(ARGV[0]); print d["dirty_worktree"]' "$manifest" 2>/dev/null || true)
    manifest_authorized=$(/usr/bin/ruby -ryaml -e 'd = YAML.load_file(ARGV[0]); print d["implementation_authorized"]' "$manifest" 2>/dev/null || true)
    [ "$manifest_branch" = 'setup/Inspection' ] && pass "CD-$cd source branch" || fail "CD-$cd source_branch is '$manifest_branch'"
    [ "$manifest_commit" = '1b530afe06a620b3b85173d10cec1f12074e2c18' ] && pass "CD-$cd source commit" || fail "CD-$cd source_commit is '$manifest_commit'"
    [ "$manifest_dirty" = 'true' ] && pass "CD-$cd dirty-worktree truth" || fail "CD-$cd dirty_worktree is '$manifest_dirty'"
    [ "$manifest_authorized" = 'false' ] && pass "CD-$cd implementation remains unauthorized" || fail "CD-$cd implementation_authorized is '$manifest_authorized'"
  fi

  handoff="$dir/CLAUDE_CODE_HANDOFF_CD-$cd.md"
  if [ -s "$handoff" ]; then
    /usr/bin/grep -Fq 'NOT EXECUTABLE' "$handoff" || fail "CD-$cd handoff lacks NOT EXECUTABLE"
    /usr/bin/grep -Fq 'implementation_authorized: false' "$handoff" || fail "CD-$cd handoff lacks implementation_authorized: false"
  fi

  evidence="$dir/EVIDENCE_MANIFEST_CD-$cd.csv"
  if [ -s "$evidence" ]; then
    for image in "$dir"/*.png; do
      [ -e "$image" ] || continue
      base=$(/usr/bin/basename "$image")
      expected_hash=$(/usr/bin/shasum -a 256 "$image" | /usr/bin/awk '{print $1}')
      if /usr/bin/grep -F "$base" "$evidence" | /usr/bin/grep -Fq "$expected_hash"; then
        pass "CD-$cd evidence hash $base"
      else
        fail "CD-$cd evidence manifest hash missing/mismatched for $base"
      fi
    done
  fi
done

if /usr/bin/grep -Rqs 'READY_FOR_MANDATORY_FINAL_REVIEW' "$root"; then
  pass 'ready marker exists'
else
  fail 'READY_FOR_MANDATORY_FINAL_REVIEW marker not found'
fi

if [ "$failures" -eq 0 ]; then
  printf '\nPASS: corrected return passed the mechanical gate. Independent semantic/visual review is still required.\n'
  exit 0
fi

printf '\nFAIL: %s mechanical gate issue(s). Do not begin final approval review.\n' "$failures"
exit 1
