.PHONY: submodule gomod node start clean

SHELL=/usr/bin/env bash

LOTUS_PATH:=extern/lotus

GOCC?=go

submodule:
	git submodule set-branch -b master node/$(LOTUS_PATH)
	git submodule sync $(LOTUS_PATH)
	git submodule update --init --recursive --remote --force $(LOTUS_PATH)
	make -C $(LOTUS_PATH) clean deps

gomod:
	@echo "module github.com/filecoin-project/fevm-contract-tests/node" > go.mod
	@echo "go 1.22" >> go.mod
	@echo "replace github.com/filecoin-project/lotus => ./extern/lotus" >> go.mod
	@echo "replace github.com/filecoin-project/filecoin-ffi => ./extern/lotus/extern/filecoin-ffi" >> go.mod
	go mod tidy

node: submodule gomod
	$(GOCC) build -o bin/node ./main.go

start:
	./bin/node

clean:
	make -C $(LOTUS_PATH) clean
	rm -f ./bin
