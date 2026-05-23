#!/usr/bin/env bash
#
# bootstrap-linux.sh
#
# Common bootstrap that runs once during the Packer build and bakes the
# image so every spawned VM is ready in seconds. Idempotent — safe to
# re-run during local debugging.
#
# Goals:
#   - Install qemu-guest-agent so the hypervisor can read the IP back fast
#   - Install cloud-init (already present on most cloud images, but ensure)
#   - Harden SSH (no root password, no DNS, key-only)
#   - Clean apt/yum caches and machine-id so the image is portable
#

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

log()  { echo -e "\n\033[1;36m▶\033[0m $*"; }
ok()   { echo -e "\033[32m✓\033[0m $*"; }

# Detect the package manager
if command -v apt-get >/dev/null 2>&1; then
  PKG=apt
elif command -v dnf >/dev/null 2>&1; then
  PKG=dnf
elif command -v yum >/dev/null 2>&1; then
  PKG=yum
else
  echo "Unsupported distro: no apt/dnf/yum"
  exit 1
fi

log "Updating package index"
case "$PKG" in
  apt) apt-get update -y -qq ;;
  dnf) dnf -q -y makecache ;;
  yum) yum -q -y makecache ;;
esac

log "Installing baseline packages (qemu-guest-agent, cloud-init, curl, ca-certs, vim, htop)"
case "$PKG" in
  apt)
    apt-get install -y -qq \
      qemu-guest-agent cloud-init cloud-initramfs-growroot \
      curl ca-certificates vim htop tmux \
      net-tools dnsutils traceroute mtr-tiny \
      iotop sysstat
    ;;
  dnf|yum)
    $PKG install -y -q \
      qemu-guest-agent cloud-init cloud-utils-growpart \
      curl ca-certificates vim htop tmux \
      net-tools bind-utils traceroute mtr \
      iotop sysstat
    ;;
esac
ok "Baseline packages installed"

log "Enabling qemu-guest-agent + cloud-init at boot"
systemctl enable qemu-guest-agent.service
systemctl enable cloud-init.service cloud-config.service cloud-final.service cloud-init-local.service

log "Hardening SSH"
SSHCFG=/etc/ssh/sshd_config
sed -ri 's/^#?PasswordAuthentication\s+yes/PasswordAuthentication no/' "$SSHCFG" || true
sed -ri 's/^#?PermitRootLogin\s+yes/PermitRootLogin prohibit-password/' "$SSHCFG" || true
sed -ri 's/^#?UseDNS\s+yes/UseDNS no/' "$SSHCFG" || true
echo "ClientAliveInterval 60" >> "$SSHCFG"
echo "ClientAliveCountMax 3"  >> "$SSHCFG"
ok "sshd config hardened"

log "Disabling unattended-upgrades reboots (we manage patching ourselves)"
if [ -f /etc/apt/apt.conf.d/50unattended-upgrades ]; then
  sed -ri 's|^//\s*Unattended-Upgrade::Automatic-Reboot\s+"true";|Unattended-Upgrade::Automatic-Reboot "false";|' \
    /etc/apt/apt.conf.d/50unattended-upgrades || true
fi

log "Pre-pulling NetLayer agent (placeholder — replace with real binary URL once published)"
mkdir -p /opt/netlayer
cat > /opt/netlayer/version <<EOF
NETLAYER_AGENT_VERSION=stub
NETLAYER_BUILT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

log "Cleaning up"
case "$PKG" in
  apt) apt-get clean -y; rm -rf /var/lib/apt/lists/* ;;
  dnf) dnf clean all -q ;;
  yum) yum clean all -q ;;
esac
rm -rf /tmp/* /var/tmp/* /var/log/*.gz /var/log/*.[0-9] /root/.bash_history || true

# Reset machine-id so cloud-init picks a fresh one per VM
truncate -s 0 /etc/machine-id
[ -L /var/lib/dbus/machine-id ] || ln -sf /etc/machine-id /var/lib/dbus/machine-id

# Trim filesystem to shrink the qcow2
fstrim -av || true

ok "Image bootstrap complete"
