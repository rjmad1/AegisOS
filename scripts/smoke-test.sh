#!/bin/bash
# scripts/smoke-test.sh
# Deployment Verification Smoke Test Engine for Canary/Rolling upgrades.
# Probes target server APIs and validates endpoint payload responses.

set -e

TARGET_URL=${1:-"http://localhost:3000"}

log_action() {
  echo -e "\033[1;34m[SmokeTester] Testing $1...\033[0m"
}

log_pass() {
  echo -e "\033[1;32m[SmokeTester] PASS: $1\033[0m"
}

log_fail() {
  echo -e "\033[1;31m[SmokeTester] FAIL: $1\033[0m"
  exit 1
}

# 1. Probe base URL
log_action "Probing root page at ${TARGET_URL}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${TARGET_URL}")

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 302 ] || [ "$HTTP_STATUS" -eq 307 ]; then
  log_pass "Root endpoint returned HTTP status $HTTP_STATUS"
else
  log_fail "Root endpoint returned unexpected status code: $HTTP_STATUS (Expected 200, 302, 307)"
fi

# 2. Probe API Health check
HEALTH_API="${TARGET_URL}/api/health"
log_action "Querying API Health at ${HEALTH_API}"

RESPONSE=$(curl -s --max-time 5 "${HEALTH_API}" || echo "failed")

if [ "$RESPONSE" = "failed" ]; then
  log_fail "Failed to connect to health endpoint: ${HEALTH_API}"
fi

log_info() {
  echo -e "\033[0;36m[SmokeTester] Response: $1\033[0m"
}
log_info "$RESPONSE"

# Check if response contains "healthy" or "status"
if echo "$RESPONSE" | grep -q '"status":"healthy"' || echo "$RESPONSE" | grep -q '"status": "healthy"'; then
  log_pass "Health API reports healthy status."
else
  log_fail "Health API payload did not indicate healthy status: ${RESPONSE}"
fi

# 3. Check specific metadata endpoints (Optional)
METADATA_API="${TARGET_URL}/api/info"
log_action "Checking metadata details at ${METADATA_API}"
INFO_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${METADATA_API}")

if [ "$INFO_RESPONSE" -eq 200 ] || [ "$INFO_RESPONSE" -eq 404 ] || [ "$INFO_RESPONSE" -eq 401 ]; then
  # 404 is acceptable if auth gates block anonymous query
  log_pass "Metadata API returned code: $INFO_RESPONSE"
else
  log_fail "Metadata API returned unexpected error status: $INFO_RESPONSE"
fi

echo "==================================================="
log_pass "DEPLOYMENT SMOKE TEST SUCCESSFUL. Target is stable."
echo "==================================================="
exit 0
