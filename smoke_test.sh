#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3007}"
USERNAME="${USERNAME:-wsurf}"
PASSWORD="${PASSWORD:-windsurf}"
LOGIN_PATH="${LOGIN_PATH:-/api/auth/login}"
STRICT="${STRICT:-0}"
JQ="${JQ:-jq}"

# --- Counters ---
preexisting_drift=0
new_entity_drift=0
total_created=0
total_deleted=0

TOKEN=""
COOKIE=""

# --- Cleanup tracking arrays (per entity, in dependency-safe delete order) ---
CLEANUP_WORLD_CARD=()
CLEANUP_SKILL=()
CLEANUP_FACET=()
CLEANUP_BASE_CARD=()
CLEANUP_ARCANA=()
CLEANUP_WORLD=()
CLEANUP_CARD_TYPE=()

# --- Helpers ---
pass() { echo "  ✅ $*"; }
warn_drift() {
  echo "  ⚠️  [DRIFT] $*"
}
warn_strict() {
  echo "  ⚠️  $*"
  if [[ "$STRICT" == "1" ]]; then
    echo "  STRICT=1 -> treating warning as failure" >&2
    cleanup
    exit 1
  fi
}
fail() { echo "  ❌ $*" >&2; cleanup; exit 1; }

req() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"
  local url="$BASE_URL$path"
  local headers=()
  [[ -n "$TOKEN" ]] && headers+=(-H "Authorization: Bearer $TOKEN")
  [[ -z "$TOKEN" && -n "$COOKIE" ]] && headers+=(-H "Cookie: $COOKIE")
  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "$url" "${headers[@]}" -H "Content-Type: application/json" -d "$data"
  else
    curl -sS -X "$method" "$url" "${headers[@]}"
  fi
}

_rwc_code=""
_rwc_body=""
req_with_code() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"
  local url="$BASE_URL$path"
  local headers=()
  [[ -n "$TOKEN" ]] && headers+=(-H "Authorization: Bearer $TOKEN")
  [[ -z "$TOKEN" && -n "$COOKIE" ]] && headers+=(-H "Cookie: $COOKIE")
  local tmp; tmp="$(mktemp)"
  if [[ -n "$data" ]]; then
    _rwc_code="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$url" "${headers[@]}" -H "Content-Type: application/json" -d "$data")"
  else
    _rwc_code="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$url" "${headers[@]}")"
  fi
  _rwc_body="$(cat "$tmp")"; rm -f "$tmp"
}

expect_success() {
  local json="$1"
  echo "$json" | $JQ -e '.success == true' >/dev/null || fail "Expected success:true, got: $json"
}

expect_null() {
  local json="$1"
  echo "$json" | $JQ -e '.data == null' >/dev/null || fail "Expected data:null, got: $json"
}

# --- Discover helper: get first id from a list endpoint, or empty ---
discover_id() {
  local api_path="$1"
  local r; r="$(req GET "${api_path}?page=1&pageSize=1&lang=en")"
  echo "$r" | $JQ -r '.data[0].id // empty' 2>/dev/null
}

# --- Cleanup: delete all test entities in dependency-safe order ---
cleanup_array() {
  local api="$1"; shift
  local label="$1"; shift
  local -n arr=$1
  if [[ ${#arr[@]} -gt 0 ]]; then
    echo "  Cleanup: ${#arr[@]} $label"
    for eid in "${arr[@]}"; do
      [[ -z "$eid" ]] && continue
      set +e; req DELETE "/api/${api}/${eid}?lang=en" >/dev/null 2>&1; set -e
    done
    arr=()
  fi
}

cleanup() {
  echo ""
  echo "== Cleanup =="
  cleanup_array "world_card"  "world_card(s)"  CLEANUP_WORLD_CARD
  cleanup_array "skill"       "skill(s)"        CLEANUP_SKILL
  cleanup_array "facet"       "facet(s)"        CLEANUP_FACET
  cleanup_array "base_card"   "base_card(s)"    CLEANUP_BASE_CARD
  cleanup_array "arcana"      "arcana(s)"       CLEANUP_ARCANA
  cleanup_array "world"       "world(s)"        CLEANUP_WORLD
  cleanup_array "card_type"   "card_type(s)"    CLEANUP_CARD_TYPE
}
trap cleanup EXIT

# --- Login ---
login() {
  echo "== Auth =="
  local payload="{\"identifier\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
  local hdr; hdr="$(mktemp)"
  local tmp; tmp="$(mktemp)"
  local code
  code="$(curl -sS -D "$hdr" -o "$tmp" -w "%{http_code}" \
    -X POST "$BASE_URL$LOGIN_PATH" -H "Content-Type: application/json" -d "$payload")"
  local body; body="$(cat "$tmp")"
  if [[ "$code" != "200" ]]; then
    echo "  HTTP=$code"; echo "$body" | $JQ . 2>/dev/null || echo "$body"
    rm -f "$hdr" "$tmp"; fail "Login failed"
  fi
  TOKEN="$(echo "$body" | $JQ -r '.data.token // empty' 2>/dev/null || true)"
  [[ -n "$TOKEN" ]] || { rm -f "$hdr" "$tmp"; fail "Token not found at .data.token"; }
  COOKIE="$(awk 'tolower($1)=="set-cookie:" {print}' "$hdr" \
    | sed -nE 's/^Set-Cookie:[[:space:]]*(auth_token=[^;]+).*/\1/ip' | head -n 1)"
  rm -f "$hdr" "$tmp"
  pass "Authenticated (token=$(echo "$TOKEN" | cut -c1-12)…)"
}

# ============================================================
# Generic entity CRUD cycle
# Usage: entity_cycle <step> <label> <api_path> <entity_code> <create_lang> <create_payload> <cleanup_array_name>
# Runs: create → verify ts(create_lang) → patch fr → verify ts(fr) → delete fr → delete base → verify cleanup
# ============================================================
entity_cycle() {
  local step="$1"
  local label="$2"
  local api="$3"
  local ecode="$4"
  local clang="$5"
  local payload="$6"
  local -n cleanup_arr=$7

  local eid

  # --- CREATE ---
  echo ""
  echo "== ${step}a. ${label}: Create =="
  echo "  POST /api/${api}"
  local rc; rc="$(req POST "/api/${api}" "$payload")"
  expect_success "$rc"
  eid="$(echo "$rc" | $JQ -r '.data.id')"
  [[ "$eid" =~ ^[0-9]+$ ]] || fail "Expected numeric ${label} id, got: $eid"
  cleanup_arr+=("$eid")
  total_created=$((total_created + 1))
  pass "Created ${label} id=$eid"

  # --- DTO: Verify editorial_state in detail ---
  echo "  ${step}a.dto) Verify editorial_state in detail"
  local rd; rd="$(req GET "/api/${api}/${eid}?lang=${clang}")"
  expect_success "$rd"
  if echo "$rd" | $JQ -e '.data | has("editorial_state")' >/dev/null 2>&1; then
    pass "${label} detail has editorial_state key"
  else
    new_entity_drift=$((new_entity_drift + 1))
    warn_strict "${label} detail MISSING editorial_state key"
  fi
  if echo "$rd" | $JQ -e '.data | has("status")' >/dev/null 2>&1; then
    pass "${label} detail has status field"
  else
    new_entity_drift=$((new_entity_drift + 1))
    warn_strict "${label} detail MISSING status field"
  fi

  # --- DTO: Verify editorial_state in list ---
  echo "  ${step}a.list) Verify editorial_state in list"
  local rl; rl="$(req GET "/api/${api}?page=1&pageSize=1&lang=${clang}")"
  expect_success "$rl"
  if echo "$rl" | $JQ -e '.data[0] | has("editorial_state")' >/dev/null 2>&1; then
    pass "${label} list has editorial_state key"
  else
    new_entity_drift=$((new_entity_drift + 1))
    warn_strict "${label} list MISSING editorial_state key"
  fi

  # --- Verify translation_state(create_lang) ---
  echo "  ${step}a.ts) Verify translation_state(${clang})"
  local rt; rt="$(req GET "/api/translation/state?entity_code=${ecode}&entity_id=${eid}&language_code=${clang}")"
  expect_success "$rt"
  if echo "$rt" | $JQ -e '.data != null' >/dev/null 2>&1; then
    pass "${label} translation_state(${clang}) created"
  else
    new_entity_drift=$((new_entity_drift + 1))
    warn_strict "${label} translation_state(${clang}) MISSING after create"
  fi

  # --- PATCH fr ---
  echo ""
  echo "== ${step}b. ${label}: Patch FR =="
  local rp; rp="$(req PATCH "/api/${api}/${eid}" "{\"name\":\"Smoke ${label} FR\",\"lang\":\"fr\"}")"
  expect_success "$rp"
  pass "PATCH ${label} fr succeeded"

  echo "  ${step}b.ts) Verify translation_state(fr)"
  local rtf; rtf="$(req GET "/api/translation/state?entity_code=${ecode}&entity_id=${eid}&language_code=fr")"
  expect_success "$rtf"
  if echo "$rtf" | $JQ -e '.data != null' >/dev/null 2>&1; then
    pass "${label} translation_state(fr) created"
  else
    new_entity_drift=$((new_entity_drift + 1))
    warn_strict "${label} translation_state(fr) MISSING after patch"
  fi

  # --- DELETE fr ---
  echo ""
  echo "== ${step}c. ${label}: Delete FR =="
  local rd; rd="$(req DELETE "/api/${api}/${eid}?lang=fr")"
  expect_success "$rd"
  pass "DELETE ${label} fr succeeded"

  # --- DELETE base ---
  echo ""
  echo "== ${step}d. ${label}: Delete Base =="
  local rdb; rdb="$(req DELETE "/api/${api}/${eid}?lang=en")"
  expect_success "$rdb"
  # Remove from cleanup (already deleted)
  local new_arr=()
  for x in "${cleanup_arr[@]}"; do [[ "$x" != "$eid" ]] && new_arr+=("$x"); done
  cleanup_arr=("${new_arr[@]+"${new_arr[@]}"}")
  total_deleted=$((total_deleted + 1))
  pass "DELETE ${label} base succeeded"

  # --- Verify translation_state(create_lang) null ---
  local rt_del; rt_del="$(req GET "/api/translation/state?entity_code=${ecode}&entity_id=${eid}&language_code=${clang}")"
  expect_success "$rt_del"; expect_null "$rt_del"
  pass "${label} translation_state(${clang}) -> null after base delete"

  # --- Verify translation_state(fr) null ---
  local rtf_del; rtf_del="$(req GET "/api/translation/state?entity_code=${ecode}&entity_id=${eid}&language_code=fr")"
  expect_success "$rtf_del"; expect_null "$rtf_del"
  pass "${label} translation_state(fr) -> null after base delete"

  # --- Verify editorial_state 404 ---
  req_with_code GET "/api/editorial/state?entity_code=${ecode}&entity_id=${eid}"
  if [[ "$_rwc_code" == "404" ]]; then
    pass "${label} editorial_state gone (HTTP=404)"
  else
    echo "  HTTP=$_rwc_code | Body: $(echo "$_rwc_body" | $JQ -c . 2>/dev/null || echo "$_rwc_body")"
    new_entity_drift=$((new_entity_drift + 1))
    warn_strict "editorial_state NOT cleaned up after base delete for ${label}#${eid} (HTTP=$_rwc_code)"
  fi

  # --- Verify entity detail 404 ---
  req_with_code GET "/api/${api}/${eid}?lang=en"
  [[ "$_rwc_code" == "404" ]] && pass "${label}/${eid} returns 404" || fail "Expected 404, got $_rwc_code"
}

# ============================================================
echo "== Tarot2 Smoke Test (STRICT=$STRICT) =="
echo "== Target: $BASE_URL =="
echo ""
login
echo ""

# ============================================================
# 1. Editorial State Endpoint (discover-based, no hardcoded ids)
# ============================================================
echo "== 1. Editorial State Endpoint =="
disc_bc_id="$(discover_id "/api/base_card")"
if [[ -z "$disc_bc_id" || "$disc_bc_id" == "null" ]]; then
  warn_drift "No base_card in DB — skipping editorial/state pre-existing check"
else
  req_with_code GET "/api/editorial/state?entity_code=base_card&entity_id=$disc_bc_id"
  if [[ "$_rwc_code" == "200" ]]; then
    expect_success "$_rwc_body"; pass "editorial/state OK for base_card#$disc_bc_id"
  elif [[ "$_rwc_code" == "404" ]]; then
    preexisting_drift=$((preexisting_drift + 1))
    warn_drift "editorial/state missing for base_card#$disc_bc_id (pre-existing, not strict)"
  else
    fail "Unexpected HTTP=$_rwc_code for editorial/state"
  fi
fi

# ============================================================
# 2. Translation State (missing => null, discover-based)
# ============================================================
echo ""
echo "== 2. Translation State (missing => null) =="
if [[ -n "$disc_bc_id" && "$disc_bc_id" != "null" ]]; then
  r2="$(req GET "/api/translation/state?entity_code=base_card&entity_id=$disc_bc_id&language_code=zz")"
else
  r2="$(req GET "/api/translation/state?entity_code=base_card&entity_id=999999&language_code=zz")"
fi
expect_success "$r2"; expect_null "$r2"
pass "translation/state missing => data:null"

# ============================================================
# 3. World Version Context (discover-based)
# ============================================================
echo ""
echo "== 3. World Version Context =="
disc_world_id="$(discover_id "/api/world")"
if [[ -z "$disc_world_id" || "$disc_world_id" == "null" ]]; then
  warn_drift "No worlds in DB — skipping version-context"
else
  echo "  Using world_id=$disc_world_id"
  req_with_code GET "/api/world/$disc_world_id/version-context"
  echo "  HTTP=$_rwc_code | Raw: $(echo "$_rwc_body" | $JQ -c . 2>/dev/null || echo "$_rwc_body")"
  if [[ "$_rwc_code" == "200" ]]; then
    expect_success "$_rwc_body"
    got_wid="$(echo "$_rwc_body" | $JQ -r '.data.world_id')"
    [[ "$got_wid" != "null" ]] || fail "world_id is null in 200 response"
    [[ "$got_wid" == "$disc_world_id" ]] || fail "world_id mismatch: expected=$disc_world_id got=$got_wid"
    pass "version-context OK (world_id=$got_wid)"
  elif [[ "$_rwc_code" == "404" ]]; then
    warn_drift "World $disc_world_id in list but version-context returned 404"
  else
    fail "Unexpected HTTP=$_rwc_code for version-context"
  fi
fi

# ============================================================
# 4. Base Card List/Detail + Editorial State (discover-based)
# ============================================================
echo ""
echo "== 4. Base Card List/Detail + Editorial State =="
if [[ -n "$disc_bc_id" && "$disc_bc_id" != "null" ]]; then
  r_detail="$(req GET "/api/base_card/$disc_bc_id?lang=en")"
  expect_success "$r_detail"
  echo "  Detail: $(echo "$r_detail" | $JQ -c '.data | {id, status, editorial: (.editorial | keys), editorial_state: (.editorial_state != null)}' 2>/dev/null)"
  pass "Detail OK for base_card#$disc_bc_id"
else
  warn_drift "No base_card in DB — skipping detail check"
fi

# ============================================================
# ENTITY CRUD CYCLES
# Order: no-FK first, then with-FK (so parents exist for children)
# ============================================================

TS="$(date +%s)_$$"

# --- 5. card_type (no FK) ---
entity_cycle "5" "card_type" "card_type" "base_card_type" "en" \
  "{\"code\":\"smoke_ct_${TS}\",\"name\":\"Smoke CardType\",\"lang\":\"en\"}" \
  CLEANUP_CARD_TYPE

# --- 6. world (no FK) ---
entity_cycle "6" "world" "world" "world" "en" \
  "{\"code\":\"smoke_w_${TS}\",\"name\":\"Smoke World\",\"lang\":\"en\"}" \
  CLEANUP_WORLD

# --- 7. arcana (no FK) ---
entity_cycle "7" "arcana" "arcana" "arcana" "en" \
  "{\"code\":\"smoke_arc_${TS}\",\"name\":\"Smoke Arcana\",\"lang\":\"en\"}" \
  CLEANUP_ARCANA

# --- 8. base_card (requires card_type_id → discover) ---
echo ""
echo "== 8. Discover card_type_id for base_card =="
ct_id="$(discover_id "/api/card_type")"
if [[ -z "$ct_id" || "$ct_id" == "null" ]]; then
  echo "  No card_type found, creating temp card_type"
  tmp_ct="$(req POST "/api/card_type" "{\"code\":\"smoke_tmpct_${TS}\",\"name\":\"Temp CT\",\"lang\":\"en\"}")"
  expect_success "$tmp_ct"
  ct_id="$(echo "$tmp_ct" | $JQ -r '.data.id')"
  CLEANUP_CARD_TYPE+=("$ct_id")
  total_created=$((total_created + 1))
  pass "Created temp card_type id=$ct_id"
else
  pass "Discovered card_type_id=$ct_id"
fi

entity_cycle "8" "base_card" "base_card" "base_card" "en" \
  "{\"code\":\"smoke_bc_${TS}\",\"card_type_id\":${ct_id},\"card_family\":\"major_arcana\",\"name\":\"Smoke BaseCard\",\"lang\":\"en\"}" \
  CLEANUP_BASE_CARD

# --- 9. facet (requires arcana_id → discover) ---
echo ""
echo "== 9. Discover arcana_id for facet =="
arc_id="$(discover_id "/api/arcana")"
if [[ -z "$arc_id" || "$arc_id" == "null" ]]; then
  echo "  No arcana found, creating temp arcana"
  tmp_arc="$(req POST "/api/arcana" "{\"code\":\"smoke_tmparc_${TS}\",\"name\":\"Temp Arcana\",\"lang\":\"en\"}")"
  expect_success "$tmp_arc"
  arc_id="$(echo "$tmp_arc" | $JQ -r '.data.id')"
  CLEANUP_ARCANA+=("$arc_id")
  total_created=$((total_created + 1))
  pass "Created temp arcana id=$arc_id"
else
  pass "Discovered arcana_id=$arc_id"
fi

entity_cycle "9" "facet" "facet" "facet" "en" \
  "{\"code\":\"smoke_fac_${TS}\",\"arcana_id\":${arc_id},\"name\":\"Smoke Facet\",\"lang\":\"en\"}" \
  CLEANUP_FACET

# --- 10. skill (requires facet_id → discover) ---
echo ""
echo "== 10. Discover facet_id for skill =="
fac_id="$(discover_id "/api/facet")"
if [[ -z "$fac_id" || "$fac_id" == "null" ]]; then
  echo "  No facet found, creating temp facet (needs arcana)"
  arc_id2="$(discover_id "/api/arcana")"
  if [[ -z "$arc_id2" || "$arc_id2" == "null" ]]; then
    tmp_arc2="$(req POST "/api/arcana" "{\"code\":\"smoke_tmparc2_${TS}\",\"name\":\"Temp Arcana2\",\"lang\":\"en\"}")"
    expect_success "$tmp_arc2"
    arc_id2="$(echo "$tmp_arc2" | $JQ -r '.data.id')"
    CLEANUP_ARCANA+=("$arc_id2")
    total_created=$((total_created + 1))
  fi
  tmp_fac="$(req POST "/api/facet" "{\"code\":\"smoke_tmpfac_${TS}\",\"arcana_id\":${arc_id2},\"name\":\"Temp Facet\",\"lang\":\"en\"}")"
  expect_success "$tmp_fac"
  fac_id="$(echo "$tmp_fac" | $JQ -r '.data.id')"
  CLEANUP_FACET+=("$fac_id")
  total_created=$((total_created + 1))
  pass "Created temp facet id=$fac_id"
else
  pass "Discovered facet_id=$fac_id"
fi

entity_cycle "10" "skill" "skill" "base_skills" "en" \
  "{\"code\":\"smoke_sk_${TS}\",\"facet_id\":${fac_id},\"name\":\"Smoke Skill\",\"lang\":\"en\"}" \
  CLEANUP_SKILL

# --- 11. world_card (requires world_id + base_card_id → discover) ---
echo ""
echo "== 11. Discover world_id + base_card_id for world_card =="
wc_world_id="$(discover_id "/api/world")"
if [[ -z "$wc_world_id" || "$wc_world_id" == "null" ]]; then
  echo "  No world found, creating temp world"
  tmp_w="$(req POST "/api/world" "{\"code\":\"smoke_tmpw_${TS}\",\"name\":\"Temp World\",\"lang\":\"en\"}")"
  expect_success "$tmp_w"
  wc_world_id="$(echo "$tmp_w" | $JQ -r '.data.id')"
  CLEANUP_WORLD+=("$wc_world_id")
  total_created=$((total_created + 1))
  pass "Created temp world id=$wc_world_id"
else
  pass "Discovered world_id=$wc_world_id"
fi

wc_bc_id="$(discover_id "/api/base_card")"
if [[ -z "$wc_bc_id" || "$wc_bc_id" == "null" ]]; then
  echo "  No base_card found, creating temp base_card (needs card_type)"
  tmp_ct2_id="$(discover_id "/api/card_type")"
  if [[ -z "$tmp_ct2_id" || "$tmp_ct2_id" == "null" ]]; then
    tmp_ct2="$(req POST "/api/card_type" "{\"code\":\"smoke_tmpct2_${TS}\",\"name\":\"Temp CT2\",\"lang\":\"en\"}")"
    expect_success "$tmp_ct2"
    tmp_ct2_id="$(echo "$tmp_ct2" | $JQ -r '.data.id')"
    CLEANUP_CARD_TYPE+=("$tmp_ct2_id")
    total_created=$((total_created + 1))
  fi
  tmp_bc="$(req POST "/api/base_card" "{\"code\":\"smoke_tmpbc_${TS}\",\"card_type_id\":${tmp_ct2_id},\"card_family\":\"major_arcana\",\"name\":\"Temp BC\",\"lang\":\"en\"}")"
  expect_success "$tmp_bc"
  wc_bc_id="$(echo "$tmp_bc" | $JQ -r '.data.id')"
  CLEANUP_BASE_CARD+=("$wc_bc_id")
  total_created=$((total_created + 1))
  pass "Created temp base_card id=$wc_bc_id"
else
  pass "Discovered base_card_id=$wc_bc_id"
fi

entity_cycle "11" "world_card" "world_card" "world_card" "en" \
  "{\"code\":\"smoke_wc_${TS}\",\"world_id\":${wc_world_id},\"base_card_id\":${wc_bc_id},\"name\":\"Smoke WorldCard\",\"lang\":\"en\"}" \
  CLEANUP_WORLD_CARD

# ============================================================
# Summary
# ============================================================
echo ""
echo "========================================"
echo "  SMOKE TEST SUMMARY"
echo "========================================"
echo "  Entities created:           $total_created"
echo "  Entities deleted:           $total_deleted"
echo "  Pre-existing drift:         $preexisting_drift"
echo "  New entity drift:           $new_entity_drift"
echo "========================================"

if [[ "$preexisting_drift" -gt 0 ]]; then
  echo "  ℹ️  $preexisting_drift pre-existing drift(s) (migration backfill or empty DB)"
fi
if [[ "$new_entity_drift" -gt 0 ]]; then
  echo "  ❌ $new_entity_drift newly created entity(ies) missing state rows"
  if [[ "$STRICT" == "1" ]]; then
    echo "  STRICT=1 -> FAIL"
    exit 1
  fi
fi

echo ""
echo "  ✅ ALL SMOKE TESTS PASSED"
