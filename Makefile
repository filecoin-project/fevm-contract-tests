.PHONY: fix-hardhat fix-fevm-hardhat-config generate-env build-lotus-runner start-lotus-runner \
	install-kit install-libs install-fevm-hardhat install-openzeppelin install-uniswap-v3-core \
	install test-libs test-fevm-hardhat test-openzeppelin test-uniswap-v3-core test

SHELL=/usr/bin/env bash

# Ethers.js offers a pollingInterval option on a Provider to change the default from 4s.
# Unfortunately, Hardhat obscures that behind a proxy and doesn't allow a way to modify it. We can
# run a devnet much quicker and Ethers should be able to detect changes much faster than 4s.
fix-hardhat:
	@file_paths=("extern/fevm-uniswap-v3-core/node_modules/@nomiclabs/hardhat-ethers/internal/provider-proxy.js" \
	"./extern/fevm-hardhat-kit/node_modules/@nomiclabs/hardhat-ethers/internal/provider-proxy.js" \
	"libs-tests/node_modules/@nomiclabs/hardhat-ethers/internal/provider-proxy.js"); \
	search_line="    const initialProvider = new ethers_provider_wrapper_1.EthersProviderWrapper(hardhatProvider);"; \
	insert_line="    initialProvider.pollingInterval = 200"; \
	escaped_search_line=$$(printf '%s\n' "$$search_line" | sed 's/[][\/.^$$*]/\\&/g'); \
	escaped_insert_line=$$(printf '%s\n' "$$insert_line" | sed 's/[][\/.^$$*]/\\&/g'); \
	polling_interval_pattern="    initialProvider.pollingInterval ="; \
	for file_path in $${file_paths[@]}; do \
		if ! grep -q "$$polling_interval_pattern" "$$file_path"; then \
			sed -i "/$$escaped_search_line/a\\ $$insert_line" "$$file_path"; \
			echo "Hardhat / ethers polling interval set to 200ms in $$file_path"; \
		fi \
	done

# fevm-hardhat-kit doesn't have itest network configuration by default, so we'll add one that
# points to the local node. This is necessary for the tests to run.
fix-fevm-hardhat-config:
	@config_file="extern/fevm-hardhat-kit/hardhat.config.js"; \
	search_line="networks: {"; \
	insert_line="    itest: { chainId: 314, url: require('../../kit').initNode(1000, 200) + \"/rpc/v1\", accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.PRIVATE_KEY], },"; \
	escaped_search_line=$$(printf '%s\n' "$$search_line" | sed 's/[][\/.^$$*]/\\&/g'); \
	escaped_insert_line=$$(printf '%s\n' "$$insert_line" | sed 's/[][\/.^$$*]/\\&/g'); \
	itest_pattern="itest:"; \
	if ! grep -q "$$itest_pattern" "$$config_file"; then \
			sed -i "/$$escaped_search_line/a\\ $$insert_line" "$$config_file"; \
			echo "Inserted itest network configuration in $$config_file"; \
	fi

generate-env:
	@echo "DEPLOYER_PRIVATE_KEY=0x$$(openssl rand -hex 32)" > .env
	@echo "USER_1_PRIVATE_KEY=0x$$(openssl rand -hex 32)" >> .env
	@cp .env ./libs-tests/
	@cp .env ./extern/fevm-hardhat-kit/
	@sed -i 's/USER_1_PRIVATE_KEY/PRIVATE_KEY/' ./extern/fevm-hardhat-kit/.env
	@cp .env ./extern/openzeppelin-contracts/
	@cp .env ./extern/fevm-uniswap-v3-core/
	@echo ".env file generated and copied to necessary directories"

build-lotus-runner:
	$(MAKE) -C ./node node

start-lotus-runner:
	$(MAKE) -C ./node start

install-kit:
	cd kit && npm install

install-libs: generate-env
	(cd libs-tests && \
	npm install)

install-fevm-hardhat: generate-env
	(cd extern/fevm-hardhat-kit && \
	npm install --force)

install-openzeppelin: generate-env
	(cd extern/openzeppelin-contracts && \
	npm install)

install-uniswap-v3-core: generate-env
	(cd extern/fevm-uniswap-v3-core && \
	npm install --force && \
	npm install bignumber.js@9)

install: install-kit install-libs install-fevm-hardhat install-openzeppelin install-uniswap-v3-core

test-libs: fix-hardhat
	(cd libs-tests && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest test")

# just a deploy, no tests to run
test-fevm-hardhat: fix-hardhat fix-fevm-hardhat-config
	(cd extern/fevm-hardhat-kit && \
	rm -rf deployments/ && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest deploy")

test-openzeppelin: fix-hardhat
	(cd extern/openzeppelin-contracts && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest test")

test-uniswap-v3-core: fix-hardhat
	(cd extern/fevm-uniswap-v3-core && \
	rm -rf test/__snapshots__/ && \ # TODO: generate new snapshots upstream
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest test")

test: test-libs test-fevm-hardhat test-openzeppelin test-uniswap-v3-core