.PHONY: all install build-dev build test serve clean

NPM := pnpm
ifeq (, $(shell which pnpm))
NPM = npm
endif

all: test build-dev

install: package-install.lock

package-install.lock: package.json
	${NPM} install
	touch package-install.lock

build-dev: install
	webpack-cli --config webpack.config.js

build: install
	webpack-cli --mode=production --config webpack.config.js

test: install
	${NPM} test

serve: install build-dev
	http-server

clean:
	rm -rf dist/
	rm -rf node_modules/
	rm -f package-install.lock
