// Package stormgr manages local block storage attachments (Ceph RBD).
// v0 is a stub. v1 will integrate with rbd CLI or go-ceph.
package stormgr

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
	VMID     string
	Pool     string
	Image    string
	SizeGB   uint32
	Encrypt  bool
}

// Attach maps an RBD image to the host and exposes it as a local block device.
func (s *Manager) Attach(_ context.Context, o AttachOpts) (string, error) {
	s.log.Info("stormgr: attach RBD (stub)",
		"vm_id", o.VMID, "pool", o.Pool, "image", o.Image, "size_gb", o.SizeGB)
	return "/dev/rbd/" + o.Pool + "/" + o.Image, nil
}

// Detach unmaps the RBD image.
func (s *Manager) Detach(_ context.Context, vmID, pool, image string) error {
	s.log.Info("stormgr: detach RBD (stub)", "vm_id", vmID, "pool", pool, "image", image)
	return nil
}

// Snapshot creates or deletes an RBD snapshot.
func (s *Manager) Snapshot(_ context.Context, pool, image, name string, create bool) error {
	op := "create"
	if !create {
		op = "delete"
	}
	s.log.Info("stormgr: snapshot (stub)", "pool", pool, "image", image, "name", name, "op", op)
	return nil
}
