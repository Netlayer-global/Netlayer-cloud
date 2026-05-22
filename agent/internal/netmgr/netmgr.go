// Package netmgr manages OVS / FRR / nftables on the host.
// v0 is a logging stub. v1 will use:
//   - OVS via ovsdb-go or shelling out to ovs-vsctl
//   - FRR via vtysh / netlink
//   - nftables via github.com/google/nftables
package netmgr

import (
	"context"
	"log/slog"
)

type Manager struct {
	log *slog.Logger
}

func New(log *slog.Logger) *Manager {
	return &Manager{log: log}
}

type AttachOpts struct {
	VMID    string
	VPCVNI  string
	MAC     string
	IPv4    string
	IPv6    string
}

// Attach plugs a VM's vNIC into the OVS bridge with the right VNI/VLAN.
func (n *Manager) Attach(_ context.Context, o AttachOpts) error {
	n.log.Info("netmgr: attach vNIC (stub)",
		"vm_id", o.VMID, "vni", o.VPCVNI, "mac", o.MAC, "ipv4", o.IPv4)
	return nil
}

// Detach removes the VM's vNIC from the bridge.
func (n *Manager) Detach(_ context.Context, vmID string) error {
	n.log.Info("netmgr: detach vNIC (stub)", "vm_id", vmID)
	return nil
}

// SyncFloatingIP advertises a /32 BGP route to the host owning the floating IP.
func (n *Manager) SyncFloatingIP(_ context.Context, vmID, fip string) error {
	n.log.Info("netmgr: sync floating IP (stub)", "vm_id", vmID, "fip", fip)
	return nil
}

type FirewallRule struct {
	Direction string
	Protocol  string
	PortFrom  uint32
	PortTo    uint32
	Source    string
	Action    string
	Priority  uint32
}

// SyncFirewall replaces the rule set for a VM atomically.
func (n *Manager) SyncFirewall(_ context.Context, vmID string, rules []FirewallRule) error {
	n.log.Info("netmgr: sync firewall (stub)", "vm_id", vmID, "rule_count", len(rules))
	return nil
}
