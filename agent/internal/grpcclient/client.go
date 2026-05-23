// Package grpcclient is the real gRPC implementation of the control-plane
// connection. It opens a bidirectional Connect() stream to the API, sends
// Hello + Heartbeat + Telemetry, and consumes Command messages.
//
// This file compiles only after `make proto` (or `buf generate`) has produced
// the Go stubs in proto/agent/v1/. Until then the build picks up the
// in-memory cpclient stub via build tags.
//
//go:build proto
// +build proto

package grpcclient

import (
	"context"
	"crypto/tls"
	"errors"
	"io"
	"log/slog"
	"sync/atomic"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/metadata"

	pb "github.com/netlayer/agent/proto/agent/v1"
)

type Config struct {
	Addr            string        // host:port of the control-plane gRPC endpoint
	AgentID         string
	AgentVersion    string
	Token           string        // bearer token used as `authorization` metadata
	UseTLS          bool
	HeartbeatPeriod time.Duration
	TelemetryPeriod time.Duration
}

type CommandHandler func(ctx context.Context, c *pb.Command) (*pb.CommandAck, error)

type Client struct {
	cfg     Config
	log     *slog.Logger
	conn    *grpc.ClientConn
	stream  pb.AgentBus_ConnectClient
	closed  atomic.Bool
}

func New(cfg Config, log *slog.Logger) *Client {
	return &Client{cfg: cfg, log: log}
}

func (c *Client) Run(ctx context.Context, handler CommandHandler) error {
	creds := insecure.NewCredentials()
	if c.cfg.UseTLS {
		creds = credentials.NewTLS(&tls.Config{MinVersion: tls.VersionTLS12})
	}

	conn, err := grpc.NewClient(
		c.cfg.Addr,
		grpc.WithTransportCredentials(creds),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                30 * time.Second,
			Timeout:             10 * time.Second,
			PermitWithoutStream: true,
		}),
	)
	if err != nil {
		return err
	}
	c.conn = conn
	defer conn.Close()

	bus := pb.NewAgentBusClient(conn)

	md := metadata.New(map[string]string{
		"authorization": "Bearer " + c.cfg.Token,
		"x-agent-id":    c.cfg.AgentID,
	})
	streamCtx := metadata.NewOutgoingContext(ctx, md)

	stream, err := bus.Connect(streamCtx)
	if err != nil {
		return err
	}
	c.stream = stream

	// Hello (always first frame after stream open)
	if err := stream.Send(&pb.AgentMessage{Payload: &pb.AgentMessage_Hello{Hello: &pb.Hello{
		AgentId: c.cfg.AgentID,
		Version: c.cfg.AgentVersion,
	}}}); err != nil {
		return err
	}

	// Heartbeat ticker
	heartbeat := time.NewTicker(c.cfg.HeartbeatPeriod)
	defer heartbeat.Stop()
	telemetry := time.NewTicker(c.cfg.TelemetryPeriod)
	defer telemetry.Stop()

	// Receive loop in its own goroutine
	rxErr := make(chan error, 1)
	go func() {
		for {
			msg, err := stream.Recv()
			if err == io.EOF || c.closed.Load() {
				rxErr <- nil
				return
			}
			if err != nil {
				rxErr <- err
				return
			}
			switch p := msg.Payload.(type) {
			case *pb.ControlMessage_Welcome:
				c.log.Info("welcome from control plane", "agent_id", p.Welcome.AgentId)
			case *pb.ControlMessage_Command:
				ack, err := handler(ctx, p.Command)
				if err != nil {
					ack = &pb.CommandAck{CommandId: p.Command.CommandId, Success: false, Error: err.Error()}
				}
				if ack == nil {
					ack = &pb.CommandAck{CommandId: p.Command.CommandId, Success: true}
				}
				_ = stream.Send(&pb.AgentMessage{Payload: &pb.AgentMessage_Ack{Ack: ack}})
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			c.closed.Store(true)
			_ = stream.CloseSend()
			return ctx.Err()

		case err := <-rxErr:
			return err

		case <-heartbeat.C:
			_ = stream.Send(&pb.AgentMessage{Payload: &pb.AgentMessage_Heartbeat{Heartbeat: &pb.Heartbeat{
				TsMs: time.Now().UnixMilli(),
			}}})

		case <-telemetry.C:
			_ = stream.Send(&pb.AgentMessage{Payload: &pb.AgentMessage_Telemetry{Telemetry: &pb.Telemetry{
				TsMs: time.Now().UnixMilli(),
				Host: &pb.HostStats{},
			}}})
		}
	}
}

func (c *Client) Close() error {
	c.closed.Store(true)
	if c.conn != nil {
		return c.conn.Close()
	}
	return errors.New("client not started")
}
