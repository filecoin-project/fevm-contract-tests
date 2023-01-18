SHELL=/usr/bin/env bash

LOTUS_PATH:=extern/lotus

GOCC?=go

submodule:
	git submodule set-branch -b release/v1.20.0 node/extern/lotus
	git submodule sync
	git submodule update --init --recursive --remote

gomod:
	@echo "module github.com/filecoin-project/fevm-contract-tests/node" > go.mod
	@echo "go 1.18" >> go.mod
	@echo "replace github.com/filecoin-project/lotus => ./extern/lotus" >> go.mod
	@echo "replace github.com/filecoin-project/filecoin-ffi => ./extern/lotus/extern/filecoin-ffi" >> go.mod
	go mod tidy

dep:
	make -C $(LOTUS_PATH) lotus

node: submodule gomod dep
	$(GOCC) build -o bin/node ./main.go

clean:
	make -C $(LOTUS_PATH) clean
	rm -f ./node
