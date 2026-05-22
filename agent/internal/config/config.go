// Package config loads agent configuration from environment variables and flags.
package config

import (
	"flag"
	"fmt"
	"os"
	"time"
)

type Config struct {
	AgentID            string
	Version            string
	CPEndpoint         string
	CACertPath         string
	ClientCertPath     string
	ClientKeyPath      string
	MetricsAddr        string
	JournalPath        string
	HeartbeatInterval  time.Duration
	TelemetryInterval  time.Duration
	ReconnectMinBackoff time.Duration
	ReconnectMaxBackoff time.Duration
	MockMode           bool
	LogLevel           string
}

// Load builds the config from env + flags. Flags override env.
func Load() (*Config, error) {
	c := &Config{
		Version:             "0.1.0",
		AgentID:             envOr("NETLAYER_AGENT_ID", hostnameOr("agent-unknown")),
		CPEndpoint:          envOr("NETLAYER_CP_ENDPOINT", "agent-gw.netlayer.local:7443"),
		CACertPath:          os.Getenv("NETLAYER_CA_CERT"),
		ClientCertPath:      os.Getenv("NETLAYER_CLIENT_CERT"),
		ClientKeyPath:       os.Getenv("NETLAYER_CLIENT_KEY"),
		MetricsAddr:         envOr("NETLAYER_METRICS_ADDR", ":9100"),
		JournalPath:         envOr("NETLAYER_JOURNAL_PATH", "/var/lib/netlayer/journal.db"),
		HeartbeatInterval:   30 * time.Second,
		TelemetryInterval:   60 * time.Second,
		ReconnectMinBackoff: 1 * time.Second,
		ReconnectMaxBackoff: 60 * time.Second,
		LogLevel:            envOr("NETLAYER_LOG_LEVEL", "info"),
	}

	flag.BoolVar(&c.MockMode, "mock", os.Getenv("NETLAYER_MOCK") == "true",
		"Run in mock mode (no real libvirt/OVS calls)")
	flag.StringVar(&c.AgentID, "agent-id", c.AgentID, "Unique agent identifier")
	flag.StringVar(&c.CPEndpoint, "cp-endpoint", c.CPEndpoint, "Control-plane gRPC endpoint")
	flag.StringVar(&c.LogLevel, "log-level", c.LogLevel, "Log level: debug|info|warn|error")
	flag.Parse()

	if !c.MockMode {
		if c.CACertPath == "" || c.ClientCertPath == "" || c.ClientKeyPath == "" {
			return nil, fmt.Errorf("mTLS cert paths required when --mock is off")
		}
	}
	return c, nil
}

func envOr(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func hostnameOr(fallback string) string {
	if h, err := os.Hostname(); err == nil && h != "" {
		return h
	}
	return fallback
}
