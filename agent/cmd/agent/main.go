// netlayer-agent — per-host daemon for the NetLayer hyperscale platform.
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/netlayer/agent/internal/config"
	"github.com/netlayer/agent/internal/cpclient"
	"github.com/netlayer/agent/internal/netmgr"
	"github.com/netlayer/agent/internal/obs"
	"github.com/netlayer/agent/internal/stormgr"
	"github.com/netlayer/agent/internal/vmmgr"
)

var version = "dev"

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config load failed", "err", err)
		os.Exit(1)
	}
	cfg.Version = version

	log := newLogger(cfg.LogLevel)
	log.Info("netlayer-agent starting",
		"version", cfg.Version,
		"agent_id", cfg.AgentID,
		"mock", cfg.MockMode,
		"go_version", runtime.Version(),
	)

	// Metrics
	obs.Register()
	obs.BuildInfo.WithLabelValues(cfg.Version, cfg.AgentID).Set(1)
	metricsSrv := obs.Server(cfg.MetricsAddr)
	go func() {
		log.Info("metrics endpoint listening", "addr", cfg.MetricsAddr)
		if err := metricsSrv.ListenAndServe(); err != nil && err.Error() != "http: Server closed" {
			log.Error("metrics server crashed", "err", err)
		}
	}()

	// Local managers
	vm := vmmgr.New(log.With("component", "vmmgr"))
	net := netmgr.New(log.With("component", "netmgr"))
	stor := stormgr.New(log.With("component", "stormgr"))

	// Update VM count gauge periodically
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		t := time.NewTicker(15 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				obs.VMsManaged.Set(float64(vm.Count()))
			}
		}
	}()

	// Control-plane client
	cp := cpclient.New(cfg, log.With("component", "cpclient"))

	handler := buildHandler(log, vm, net, stor)

	// Signal handling
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		s := <-sig
		log.Info("shutdown signal received", "signal", s)
		cancel()
	}()

	// Run client with reconnect loop
	backoff := cfg.ReconnectMinBackoff
	for {
		err := cp.Run(ctx, handler)
		if ctx.Err() != nil {
			break
		}
		log.Warn("control-plane disconnected, reconnecting",
			"err", err, "backoff", backoff)
		select {
		case <-time.After(backoff):
		case <-ctx.Done():
		}
		backoff = nextBackoff(backoff, cfg.ReconnectMaxBackoff)
	}

	// Graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = metricsSrv.Shutdown(shutdownCtx)
	log.Info("netlayer-agent stopped cleanly")
}

func buildHandler(
	log *slog.Logger,
	vm *vmmgr.Manager,
	net *netmgr.Manager,
	_ *stormgr.Manager,
) cpclient.Handler {
	return func(ctx context.Context, cmd cpclient.Command) error {
		log.Info("command received", "id", cmd.ID, "type", cmd.Type)
		switch cmd.Type {
		case "noop":
			return nil
		case "create_vm":
			// In v1 the body would be typed; for v0 we just log.
			log.Info("create_vm received (stubbed)", "id", cmd.ID)
			return nil
		case "delete_vm":
			log.Info("delete_vm received (stubbed)", "id", cmd.ID)
			return nil
		case "power_vm":
			log.Info("power_vm received (stubbed)", "id", cmd.ID)
			return nil
		case "sync_firewall":
			log.Info("sync_firewall received (stubbed)", "id", cmd.ID)
			return nil
		default:
			log.Warn("unknown command type", "type", cmd.Type)
			return nil
		}
		_ = vm
		_ = net
	}
}

func nextBackoff(current, max time.Duration) time.Duration {
	next := current * 2
	if next > max {
		return max
	}
	return next
}

func newLogger(level string) *slog.Logger {
	var lvl slog.Level
	switch level {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}
	return slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: lvl}))
}
