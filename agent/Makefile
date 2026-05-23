.PHONY: build run test proto clean

BIN := netlayer-agent
LDFLAGS := -ldflags "-s -w -X main.version=$(shell git describe --tags --always 2>/dev/null || echo dev)"

build:
	CGO_ENABLED=0 go build $(LDFLAGS) -o $(BIN) ./cmd/agent

run: build
	./$(BIN) --mock

test:
	go test -race -cover ./...

proto:
	@echo "Regenerate Go bindings from .proto via buf (preferred)"
	@command -v buf >/dev/null 2>&1 && buf generate || ( \
	  echo "buf not found, falling back to protoc"; \
	  protoc --go_out=. --go_opt=paths=source_relative \
	         --go-grpc_out=. --go-grpc_opt=paths=source_relative \
	         proto/agent/v1/agent.proto; \
	)

build-with-grpc:
	@echo "Build the agent with the real gRPC client (requires generated proto stubs)"
	CGO_ENABLED=0 go build -tags proto $(LDFLAGS) -o $(BIN) ./cmd/agent

clean:
	rm -f $(BIN)
