#!/usr/bin/env bash
# Bootstrap a fresh Ceph cluster with cephadm. Run on the first mon node only.
# Subsequent nodes are added via `ceph orch host add` after this completes.

set -euo pipefail

MON_IP=""
CLUSTER_NAME="netlayer"
INITIAL_DASHBOARD_USER="admin"
INITIAL_DASHBOARD_PASSWORD="$(openssl rand -hex 12)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mon-ip)         MON_IP="$2";                      shift 2 ;;
    --cluster-name)   CLUSTER_NAME="$2";                shift 2 ;;
    --dashboard-user) INITIAL_DASHBOARD_USER="$2";      shift 2 ;;
    --dashboard-pass) INITIAL_DASHBOARD_PASSWORD="$2";  shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "${MON_IP}" ]]; then
  echo "Usage: cephadm-bootstrap.sh --mon-ip <ip>"
  exit 1
fi

# Install cephadm if not present
if ! command -v cephadm >/dev/null 2>&1; then
  curl -fsSL https://download.ceph.com/keys/release.asc | sudo apt-key add -
  curl -fsSL "https://download.ceph.com/debian-reef/pool/main/c/ceph/cephadm" -o /usr/local/bin/cephadm
  chmod +x /usr/local/bin/cephadm
fi

cephadm bootstrap \
  --mon-ip "${MON_IP}" \
  --cluster-network "10.0.20.0/24" \
  --initial-dashboard-user   "${INITIAL_DASHBOARD_USER}" \
  --initial-dashboard-password "${INITIAL_DASHBOARD_PASSWORD}" \
  --dashboard-password-noupdate \
  --skip-monitoring-stack

echo
echo "================================================================"
echo "Ceph bootstrap complete."
echo "  Dashboard: https://${MON_IP}:8443"
echo "  User:      ${INITIAL_DASHBOARD_USER}"
echo "  Password:  ${INITIAL_DASHBOARD_PASSWORD}"
echo "================================================================"
