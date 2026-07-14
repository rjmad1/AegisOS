#!/bin/bash
# scripts/validate-infra.sh
# Enterprise Infrastructure Health and Validation Framework.
# Checks active database ports, cache links, AI runtimes, GPU specs, and OTel routing.

set -e

# Visual formatting logs
log_info() {
  echo -e "\033[1;34m[InfraValidator] INFO: $1\033[0m"
}

log_pass() {
  echo -e "\033[1;32m[InfraValidator] PASS: $1\033[0m"
}

log_fail() {
  echo -e "\033[1;31m[InfraValidator] FAIL: $1\033[0m"
}

# 1. Probing network ports
check_port() {
  local service_name=$1
  local host=$2
  local port=$3
  local critical=$4

  if command -v nc &> /dev/null; then
    if nc -z -w3 "$host" "$port" &> /dev/null; then
      log_pass "Port check: $service_name ($host:$port) is reachable."
      return 0
    fi
  elif command -v bash &> /dev/null; then
    if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$host/$port" &> /dev/null; then
      log_pass "Port check: $service_name ($host:$port) is reachable."
      return 0
    fi
  fi

  if [ "$critical" = "true" ]; then
    log_fail "Port check: $service_name ($host:$port) is NOT reachable (CRITICAL)."
    return 1
  else
    log_info "Port check: $service_name ($host:$port) is NOT reachable (NON-CRITICAL)."
    return 0
  fi
}

# 2. Filesystem directories check
check_dir() {
  local label=$1
  local dir_path=$2
  if [ -d "$dir_path" ]; then
    log_pass "Directory check: $label ($dir_path) exists and is accessible."
    return 0
  else
    log_fail "Directory check: $label ($dir_path) is missing or inaccessible."
    return 1
  fi
}

# 3. GPU availability check
check_gpu() {
  log_info "Verifying GPU availability..."
  if command -v nvidia-smi &> /dev/null; then
    local gpu_out
    gpu_out=$(nvidia-smi --query-gpu=name,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null || true)
    if [ -n "$gpu_out" ]; then
      log_pass "GPU Check: NVIDIA hardware found:\n$gpu_out"
      return 0
    else
      log_info "GPU Check: nvidia-smi found but no active GPUs returned."
      return 0
    fi
  else
    log_info "GPU Check: nvidia-smi command not found. Assuming CPU-only/Local-workstation runtime."
    return 0
  fi
}

# Run validation loop
main() {
  echo "==================================================="
  echo "   AegisOS Enterprise Infrastructure Diagnostics   "
  echo "==================================================="
  
  local failed=0

  # Check Database
  if [ "${DATABASE_PROVIDER}" = "postgres" ] || [ "${DATABASE_PROVIDER}" = "postgresql" ]; then
    check_port "PostgreSQL Database" "postgres" 5432 "true" || failed=1
  else
    log_info "Database: Running SQLite provider. Checking database directory..."
    check_dir "SQLite databases dir" "./databases" || failed=1
  fi

  # Check Caching & Queue (Redis)
  if [ -n "${REDIS_URL}" ] || [ -n "${REDIS_HOST}" ]; then
    local redis_host=${REDIS_HOST:-"redis"}
    local redis_port=${REDIS_PORT:-6379}
    check_port "Redis Cache/Queue" "$redis_host" "$redis_port" "true" || failed=1
  fi

  # Check AI Gateways
  check_port "Ollama Model Server" "localhost" 11434 "false" || true
  check_port "LiteLLM Router Gateway" "localhost" 4000 "false" || true

  # Check Secrets Provider (Vault)
  if [ "${SECRETS_PROVIDER}" = "vault" ]; then
    check_port "HashiCorp Vault" "vault" 8200 "true" || failed=1
  fi

  # Check Object Storage (MinIO)
  if [ "${OBJECT_STORAGE_PROVIDER}" = "minio" ]; then
    check_port "MinIO Storage API" "minio" 9000 "true" || failed=1
  fi

  # Check Telemetry (OpenTelemetry Collector)
  if [ -n "${OTEL_EXPORTER_OTLP_ENDPOINT}" ]; then
    check_port "OTel Collector HTTP" "otel-collector" 4318 "false" || true
    check_port "OTel Collector gRPC" "otel-collector" 4317 "false" || true
  fi

  # Check Reverse Proxy (Nginx)
  check_port "Nginx Web Gateway" "localhost" 80 "false" || true

  # Check GPU
  check_gpu || true

  echo "---------------------------------------------------"
  if [ $failed -eq 0 ]; then
    echo -e "\033[1;32mAll active infrastructure component checks PASSED.\033[0m"
    exit 0
  else
    echo -e "\033[1;31mOne or more critical infrastructure checks FAILED.\033[0m"
    exit 1
  fi
}

main
