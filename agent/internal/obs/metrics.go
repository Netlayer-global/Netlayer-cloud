// Package obs exposes Prometheus metrics for the agent.
package obs

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	BuildInfo = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "netlayer_agent_build_info",
			Help: "Agent build information.",
		},
		[]string{"version", "agent_id"},
	)
	CPConnected = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "netlayer_agent_control_plane_connected",
			Help: "1 if connected to control plane, else 0.",
		},
	)
	CommandsReceivedTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "netlayer_agent_commands_total",
			Help: "Commands received from control plane.",
		},
		[]string{"type", "result"},
	)
	HeartbeatsSentTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "netlayer_agent_heartbeats_sent_total",
			Help: "Heartbeats sent to control plane.",
		},
	)
	VMsManaged = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "netlayer_agent_vms_managed",
			Help: "Currently managed VMs on this host.",
		},
	)
)

// Register registers all agent metrics with the default registry.
func Register() {
	prometheus.MustRegister(
		BuildInfo,
		CPConnected,
		CommandsReceivedTotal,
		HeartbeatsSentTotal,
		VMsManaged,
	)
}

// Server starts an HTTP server exposing /metrics. Returns the *http.Server so
// the caller can shut it down on SIGTERM.
func Server(addr string) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	return &http.Server{Addr: addr, Handler: mux}
}
