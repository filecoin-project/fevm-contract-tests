.PHONY: fix-hardhat fix-fevm-hardhat-config generate-env build-lotus-runner start-lotus-runner \
	install-kit install-libs install-fevm-hardhat install-openzeppelin install-uniswap-v3-core \
	install test-libs test-fevm-hardhat test-openzeppelin test-uniswap-v3-core test clean all

SHELL=/usr/bin/env bash

default:
	@echo "See the README for usage"

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
		if [ -f "$$file_path" ]; then \
			if ! grep -q "$$polling_interval_pattern" "$$file_path"; then \
				sed -i "/$$escaped_search_line/a\\ $$insert_line" "$$file_path"; \
				echo "Hardhat / ethers polling interval set to 200ms in $$file_path"; \
			fi \
		else \
			echo "File $$file_path does not exist, skipping"; \
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

.env:
	@echo "DEPLOYER_PRIVATE_KEY=0x$$(openssl rand -hex 32)" > .env
	@echo "USER_1_PRIVATE_KEY=0x$$(openssl rand -hex 32)" >> .env
	@cp .env ./libs-tests/
	@cp .env ./extern/fevm-hardhat-kit/
	@sed -i 's/USER_1_PRIVATE_KEY/PRIVATE_KEY/' ./extern/fevm-hardhat-kit/.env
	@cp .env ./extern/openzeppelin-contracts/
	@cp .env ./extern/fevm-uniswap-v3-core/
	@echo ".env file generated and copied to necessary directories"

generate-env: .env

node/bin/node:
	$(MAKE) -C ./node node

build-lotus-runner: node/bin/node

start-lotus-runner: build-lotus-runner
	$(MAKE) -C ./node start

install-kit:
	cd kit && npm install

libs-tests/node_modules:
	(cd libs-tests && \
	npm install)

install-libs: libs-tests/node_modules generate-env

extern/fevm-hardhat-kit/node_modules:
	(cd extern/fevm-hardhat-kit && \
	npm install --force)

install-fevm-hardhat: extern/fevm-hardhat-kit/node_modules generate-env

extern/fevm-uniswap-v3-core/node_modules:
	(cd extern/fevm-uniswap-v3-core && \
	npm install --force)

install-uniswap-v3-core: extern/fevm-uniswap-v3-core/node_modules generate-env

extern/openzeppelin-contracts/node_modules:
	(cd extern/openzeppelin-contracts && \
	npm install)

install-openzeppelin: extern/openzeppelin-contracts/node_modules generate-env

install: install-kit install-libs install-fevm-hardhat install-openzeppelin install-uniswap-v3-core

test-libs: install-libs fix-hardhat
	(cd libs-tests && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest test")

# just a deploy, no tests to run
test-fevm-hardhat: install-fevm-hardhat fix-hardhat fix-fevm-hardhat-config
	(cd extern/fevm-hardhat-kit && \
	rm -rf deployments/ && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest deploy")

# remove snapshots because, so far, the data doesn't seem to be stable enough—needs further investigation
test-uniswap-v3-core: install-uniswap-v3-core fix-hardhat
	(cd extern/fevm-uniswap-v3-core && \
	rm -rf extern/fevm-uniswap-v3-core/test/__snapshots__/ && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest test")

test-openzeppelin: install-openzeppelin fix-hardhat
	(cd extern/openzeppelin-contracts && \
	npm exec -c "hardhat clean" && \
	npm exec -c "hardhat --network itest test")

test: test-libs test-fevm-hardhat test-uniswap-v3-core test-openzeppelin

clean:
	@rm -rf .env
	@rm -rf libs-tests/.env
	@rm -rf libs-tests/node_modules/
	@rm -rf extern/fevm-hardhat-kit/.env
	@rm -rf extern/fevm-hardhat-kit/node_modules/
	@rm -rf extern/fevm-uniswap-v3-core/.env
	@rm -rf extern/fevm-uniswap-v3-core/node_modules/
	@rm -rf extern/openzeppelin-contracts/.env
	@rm -rf extern/openzeppelin-contracts/node_modules/
	@$(MAKE) -C ./node clean
	@echo "Cleaned up"
