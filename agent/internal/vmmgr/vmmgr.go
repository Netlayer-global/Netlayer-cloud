// Package vmmgr manages local VMs via libvirt/QEMU.
// v0 is a stub that records intended state; v1 will use github.com/digitalocean/go-libvirt.
package vmmgr

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"
)

type VMState string

const (
	StateStarting VMState = "starting"
	StateRunning  VMState = "running"
	StateStopped  VMState = "stopped"
	StateError    VMState = "error"
	StateDeleted  VMState = "deleted"
)

type VM struct {
	ID         string
	CPU        uint32
	RAMMB      uint32
	DiskGB     uint32
	State      VMState
	IPv4       string
	StartedAt  time.Time
}

type Manager struct {
	mu  sync.RWMutex
	vms map[string]*VM
	log *slog.Logger
}

func New(log *slog.Logger) *Manager {
	return &Manager{
		vms: make(map[string]*VM),
		log: log,
	}
}

type CreateOpts struct {
	VMID         string
	CPU          uint32
	RAMMB        uint32
	DiskGB       uint32
	ImageID      string
	RootPassword string
	SSHKey       string
	Hostname     string
}

// Create allocates a new VM. Idempotent on VMID.
func (m *Manager) Create(_ context.Context, o CreateOpts) (*VM, error) {
	if o.VMID == "" {
		return nil, errors.New("vm id required")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if existing, ok := m.vms[o.VMID]; ok {
		return existing, nil // idempotent
	}
	vm := &VM{
		ID:        o.VMID,
		CPU:       o.CPU,
		RAMMB:     o.RAMMB,
		DiskGB:    o.DiskGB,
		State:     StateStarting,
		StartedAt: time.Now(),
	}
	m.vms[o.VMID] = vm
	m.log.Info("vmmgr: vm created (stub)",
		"vm_id", o.VMID, "cpu", o.CPU, "ram_mb", o.RAMMB, "disk_gb", o.DiskGB)

	// Simulate boot async
	go func() {
		time.Sleep(2 * time.Second)
		m.mu.Lock()
		defer m.mu.Unlock()
		if v, ok := m.vms[o.VMID]; ok && v.State == StateStarting {
			v.State = StateRunning
			v.IPv4 = "10.0.0.42" // placeholder
		}
	}()
	return vm, nil
}

func (m *Manager) Delete(_ context.Context, vmID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.vms[vmID]; !ok {
		return nil // idempotent
	}
	delete(m.vms, vmID)
	m.log.Info("vmmgr: vm deleted (stub)", "vm_id", vmID)
	return nil
}

type PowerAction string

const (
	ActionStart    PowerAction = "start"
	ActionStop     PowerAction = "stop"
	ActionReset    PowerAction = "reset"
	ActionShutdown PowerAction = "shutdown"
)

func (m *Manager) Power(_ context.Context, vmID string, action PowerAction) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	vm, ok := m.vms[vmID]
	if !ok {
		return errors.New("vm not found")
	}
	switch action {
	case ActionStart:
		vm.State = StateRunning
	case ActionStop, ActionShutdown:
		vm.State = StateStopped
	case ActionReset:
		vm.State = StateRunning
	default:
		return errors.New("unknown action")
	}
	m.log.Info("vmmgr: power action (stub)", "vm_id", vmID, "action", action)
	return nil
}

func (m *Manager) List() []*VM {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]*VM, 0, len(m.vms))
	for _, v := range m.vms {
		out = append(out, v)
	}
	return out
}

func (m *Manager) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.vms)
}
