.PHONY: all install test

all: test

install: package-install.lock

package-install.lock: package.json
	npm install
	touch package-install.lock

test: install
	npm test
