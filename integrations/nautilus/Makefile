REGISTRY := local
APP_NAME := satya

.DEFAULT_GOAL := build
.PHONY: default build

# Create output directory
out:
	mkdir -p out

# Build the enclave Docker image
build: out
	docker build \
		--tag $(REGISTRY)/satya-enclave \
		--progress=plain \
		--platform linux/amd64 \
		--output type=local,rewrite-timestamp=true,dest=out \
		-f Containerfile \
		--build-arg ENCLAVE_APP=$(APP_NAME) \
		.

# Run enclave in production mode (requires AWS Nitro)
.PHONY: run
run: out/nitro.eif
	sudo nitro-cli \
		run-enclave \
		--cpu-count 2 \
		--memory 512M \
		--eif-path out/nitro.eif

# Run enclave with debug mode
.PHONY: run-debug
run-debug: out/nitro.eif
	sudo nitro-cli \
		run-enclave \
		--cpu-count 2 \
		--memory 512M \
		--eif-path out/nitro.eif \
		--debug-mode \
		--attach-console

# Build and test locally (without enclave)
.PHONY: dev
dev:
	RUST_LOG=debug API_KEY=dev_key cargo run --features=satya

# Run tests
.PHONY: test
test:
	cargo test --no-default-features --features=satya

# Check code with clippy
.PHONY: clippy
clippy:
	cargo clippy --no-default-features --features=satya -- -D warnings

# Format code
.PHONY: fmt
fmt:
	cargo fmt --all

# Clean build artifacts
.PHONY: clean
clean:
	cargo clean
	rm -rf out/

# Build release version
.PHONY: release
release:
	cargo build --release --no-default-features --features=satya

# Stop all running enclaves
.PHONY: stop
stop:
	sudo nitro-cli terminate-enclave --all || true

# Health check for running server
.PHONY: health
health:
	curl -f http://localhost:3000/health || echo "Server not running"

# Deploy to AWS (requires environment variables)
.PHONY: deploy
deploy: build
	@if [ -z "$(KEY_PAIR)" ]; then echo "KEY_PAIR environment variable is required"; exit 1; fi
	@if [ -z "$(EC2_INSTANCE_NAME)" ]; then echo "EC2_INSTANCE_NAME environment variable is required"; exit 1; fi
	./configure_enclave.sh $(APP_NAME)

# Show help
.PHONY: help
help:
	@echo "Satya Nautilus Integration Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  build       Build enclave Docker image"
	@echo "  dev         Run server locally for development"
	@echo "  test        Run tests"
	@echo "  clippy      Run clippy linter"
	@echo "  fmt         Format code"
	@echo "  run         Run enclave (requires AWS Nitro)"
	@echo "  run-debug   Run enclave with debug mode"
	@echo "  stop        Stop all running enclaves"
	@echo "  health      Check server health"
	@echo "  deploy      Deploy to AWS (requires KEY_PAIR and EC2_INSTANCE_NAME)"
	@echo "  clean       Clean build artifacts"
	@echo "  release     Build release version"
	@echo "  help        Show this help"