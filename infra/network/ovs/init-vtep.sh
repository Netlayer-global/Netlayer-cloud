#!/usr/bin/env bash
# Configure a single compute host as a VXLAN VTEP.
# Idempotent — safe to re-run.
set -euo pipefail

LOOPBACK_IP="${1:-}"
[[ -z "${LOOPBACK_IP}" ]] && { echo "Usage: $0 <loopback-ip>"; exit 1; }

OVS=ovs-vsctl
ip link show vxlan0 >/dev/null 2>&1 || true

# br-int: tenant integration bridge (where tap interfaces attach)
$OVS --may-exist add-br br-int
$OVS set bridge br-int protocols=OpenFlow13

# br-vxlan: underlay/overlay bridge
$OVS --may-exist add-br br-vxlan
$OVS set bridge br-vxlan protocols=OpenFlow13

# Patch the two bridges
$OVS --may-exist add-port br-int patch-int -- set Interface patch-int type=patch options:peer=patch-vxlan
$OVS --may-exist add-port br-vxlan patch-vxlan -- set Interface patch-vxlan type=patch options:peer=patch-int

# VXLAN tunnel — uses the loopback IP as the VTEP source
ip link show vxlan0 >/dev/null 2>&1 || \
  ip link add vxlan0 type vxlan id 0 dstport 4789 local "${LOOPBACK_IP}" learning nolearning external

ip link set vxlan0 up
$OVS --may-exist add-port br-vxlan vxlan0

echo "✓ VTEP bring-up complete. Source IP: ${LOOPBACK_IP}"
