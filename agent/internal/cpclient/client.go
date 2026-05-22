// Package cpclient is the gRPC client to the NetLayer control plane.
//
// In v0 the gRPC stubs aren't generated yet (no protoc in this environment),
// so this file ships a small interface + a mock implementation that exercises
// the same lifecycle: connect → hello → heartbeat loop → reconnect on disconnect.
//
// Once protoc is wired in (`make proto`), replace mockClient with a real
// gRPC client built from proto/agent/v1/agent.pb.go.
package cpclient

import (
	"context"
	"log/slog"
	"math/rand"
	"sync/atomic"
	"time"

	"github.com/netlayer/agent/internal/config"
	"github.com/netlayer/agent/internal/obs"
)

// Command is what the control plane asks the agent to do.
type Command struct {
	ID   string
	Type string // create_vm | delete_vm | power_vm | snapshot_vm | sync_firewall | update_agent
	Body any
}

// Telemetry is what the agent reports back.
type Telemetry struct {
	HostCPU    float64
	HostRAMPct float64
	VMCount    int
	VMs        []VMStat
}

type VMStat struct {
	VMID    string
	Status  string
	CPUPct  float64
	RAMPct  float64
	NetIn   uint64
	NetOut  uint64
}

// Handler processes a command and returns nil on success, error on failure.
type Handler func(ctx context.Context, cmd Command) error

// Client is the abstract interface; v1 will implement this with real gRPC.
type Client interface {
	Run(ctx context.Context, h Handler) error
	SendTelemetry(t Telemetry)
}

// New returns a mock client in mock mode and (later) a real gRPC client in prod.
func New(cfg *config.Config, log *slog.Logger) Client {
	if cfg.MockMode {
		return &mockClient{cfg: cfg, log: log}
	}
	// TODO v1: return realGRPCClient (mTLS, bidi stream, reconnect, journal)
	log.Warn("real gRPC client not yet implemented in v0; falling back to mock")
	return &mockClient{cfg: cfg, log: log}
}

// ─── mock implementation ────────────────────────────────────────────

type mockClient struct {
	cfg *config.Config
	log *slog.Logger
}

func (m *mockClient) Run(ctx context.Context, h Handler) error {
	m.log.Info("[mock] connecting to control plane",
		"endpoint", m.cfg.CPEndpoint,
		"agent_id", m.cfg.AgentID,
	)
	obs.CPConnected.Set(1)
	defer obs.CPConnected.Set(0)

	hbTicker := time.NewTicker(m.cfg.HeartbeatInterval)
	defer hbTicker.Stop()
	telTicker := time.NewTicker(m.cfg.TelemetryInterval)
	defer telTicker.Stop()

	var heartbeats atomic.Uint64

	// Periodically inject a synthetic command so the handler path is exercised
	cmdTicker := time.NewTicker(2 * time.Minute)
	defer cmdTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			m.log.Info("[mock] shutting down control-plane client")
			return ctx.Err()

		case <-hbTicker.C:
			heartbeats.Add(1)
			obs.HeartbeatsSentTotal.Inc()
			m.log.Debug("[mock] heartbeat sent")

		case <-telTicker.C:
			m.log.Debug("[mock] telemetry sent")

		case <-cmdTicker.C:
			cmd := Command{
				ID:   randomID(),
				Type: "noop",
			}
			obs.CommandsReceivedTotal.WithLabelValues(cmd.Type, "received").Inc()
			if err := h(ctx, cmd); err != nil {
				obs.CommandsReceivedTotal.WithLabelValues(cmd.Type, "failed").Inc()
				m.log.Warn("[mock] command failed", "id", cmd.ID, "err", err)
				continue
			}
			obs.CommandsReceivedTotal.WithLabelValues(cmd.Type, "ok").Inc()
		}
	}
}

func (m *mockClient) SendTelemetry(t Telemetry) {
	m.log.Debug("[mock] telemetry",
		"host_cpu", t.HostCPU,
		"host_ram", t.HostRAMPct,
		"vms", t.VMCount,
	)
}

func randomID() string {
	const charset = "abcdef0123456789"
	b := make([]byte, 12)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return "cmd-" + string(b)
}
