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
	@echo "Regenerate Go bindings from .proto"
	@echo "Requires: protoc, protoc-gen-go, protoc-gen-go-grpc"
	protoc --go_out=. --go_opt=paths=source_relative \
	       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
	       proto/agent/v1/agent.proto

clean:
	rm -f $(BIN)
