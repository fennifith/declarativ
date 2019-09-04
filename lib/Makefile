.PHONY: all install build test

all: test

install: package-install.lock

package-install.lock: package.json
	npm install
	touch package-install.lock

build: install
	webpack-cli --config webpack.config.js

test: install
	npm test
