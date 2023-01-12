SHELL=/usr/bin/env bash

LOTUS_PATH:=extern/lotus

GOCC?=go

submodule:
	git submodule set-branch -b feat/nv18-fevm node/extern/lotus
	git submodule sync
	git submodule update --init --recursive --remote
	go mod tidy

dep:
	make -C $(LOTUS_PATH) lotus

node: submodule dep
	$(GOCC) build -o bin/node ./main.go

clean:
	make -C $(LOTUS_PATH) clean
	rm -f ./node
