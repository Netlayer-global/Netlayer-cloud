# NetLayer Agent

Lightweight per-host daemon that runs on every NetLayer hypervisor. Manages VM lifecycle, networking, storage, and telemetry under control of the NetLayer Control Plane.

## Status

**v0 — skeleton.** Connects to the control plane via mTLS gRPC, registers itself, streams heartbeats and metrics. VM lifecycle commands are stubbed (mock execution, real libvirt integration in v1).

## Design goals

- Single static Go binary (< 20 MB)
- Footprint < 64 MB RSS, < 1% CPU idle
- Survives control-plane disconnect (VMs keep running)
- mTLS with SPIFFE-style SVID rotation
- Idempotent commands (safe to retry)
- Local SQLite WAL for command journaling

## Layout

```
agent/
├── cmd/agent/main.go                # entry point
├── internal/
│   ├── config/                      # env + flag config
│   ├── cpclient/                    # control-plane gRPC client
│   ├── vmmgr/                       # libvirt / qemu wrapper (stub in v0)
│   ├── netmgr/                      # OVS / FRR wrapper (stub in v0)
│   ├── stormgr/                     # Ceph RBD wrapper (stub in v0)
│   ├── fwsync/                      # nftables sync (stub in v0)
│   ├── obs/                         # Prometheus exporter
│   └── journal/                     # local command WAL (SQLite)
├── proto/
│   └── agent/v1/agent.proto         # gRPC contract (shared with control plane)
├── go.mod
└── Makefile
```

## Build

```bash
cd agent
go build -ldflags="-s -w" -o netlayer-agent ./cmd/agent
```

## Run (mock mode, no control plane required)

```bash
./netlayer-agent --mock
```

## Run against a real control plane

```bash
NETLAYER_AGENT_ID=host-01 \
NETLAYER_CP_ENDPOINT=agent-gw.netlayer.local:7443 \
NETLAYER_CA_CERT=/etc/netlayer/ca.pem \
NETLAYER_CLIENT_CERT=/etc/netlayer/agent.pem \
NETLAYER_CLIENT_KEY=/etc/netlayer/agent.key \
./netlayer-agent
```

## Testing

```bash
go test ./...
```
