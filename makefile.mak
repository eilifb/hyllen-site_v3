# Variables
# Canonical version: repo root `.version` (see scripts/read-version.js).
# `.env.local` often sets TAG=latest for docker-compose — that must NOT drive registry tags.
-include .env.local

VERSION := $(strip $(shell node scripts/read-version.js 2>NUL))
# Image tag for `make build` / `make push` (defaults to .version). Override: `make push IMAGE_TAG=x`.
IMAGE_TAG ?= $(VERSION)
REGISTRY_IMAGE := $(DOCKER_URL)/$(IMAGE_NAME)
IMAGE := $(REGISTRY_IMAGE):$(IMAGE_TAG)
LATEST_IMAGE := $(REGISTRY_IMAGE):latest
RAW_VERSION := $(if $(REACT_APP_VERSION),$(REACT_APP_VERSION),$(VERSION))
BUILD_VERSION := $(patsubst v%,%,$(RAW_VERSION))
SITE_URL = http://localhost:$(HOST_PORT)
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
# current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))
PWD := $(dir $(mkfile_path))

# Build the Docker image
sync-version:
	@node scripts/sync-version.js

# Build the Docker image
build: sync-version
# actual build command
	docker build --build-arg VITE_APP_VERSION=$(BUILD_VERSION) --build-arg REACT_APP_VERSION=$(BUILD_VERSION) -f app/Dockerfile -t $(IMAGE) -t $(LATEST_IMAGE) .

# Run the Docker container
run:
# actual build command
	docker run --name $(CONTAINER_NAME) --rm -d -p $(HOST_PORT):80 $(IMAGE)

# Stop and remove the container
clean:
# actual clean command
	docker rm -f $(CONTAINER_NAME)

# Local UI with hot reload — no Docker. Runs app predev (sync-version) then Vite dev server.
test:
	cd "$(PWD)app" && npm run dev

# Smoke the production nginx image in Docker, then open the site (Windows browser).
image-test: build
	$(MAKE) clean
	$(MAKE) run
	@powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process '$(SITE_URL)'"

verify-version-tag:
	@node scripts/verify-head-version-tag.js

tag:
	@node scripts/create-version-tag.js

push: verify-version-tag build
	@echo Pushing $(IMAGE) to registry
	docker push $(IMAGE)
	@echo Pushing $(LATEST_IMAGE) to registry
	docker push $(LATEST_IMAGE)

info:
	@echo VERSION=$(VERSION) IMAGE_TAG=$(IMAGE_TAG)
	@echo IMAGE=$(IMAGE) LATEST_IMAGE=$(LATEST_IMAGE)
.PHONY: sync-version upversion build run test image-test clean verify-version-tag tag push print