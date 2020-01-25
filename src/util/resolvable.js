/**
 * Useful data-handling classes and functions.
 *
 * @module util/resolvable
 */

/**
 * A wrapper class for data-based promises and/or arbitrary
 * values that enter a component.
 *
 * @property {Object|function(Object): Object|Promise<Object>}
 * @class DataResolvable
 */
class DataResolvable {
    constructor(value) {
        if (value instanceof DataResolvable)
            this.value = value.value;
        else this.value = value;
    }

    isBlocking() {
        return this.value instanceof Promise;
    }

    async resolve(data) {
        // TODO: ideally, Promises/functions should resolve recursively (e.g. Promises that return a function), but this breaks the Component's forEach functionality.
        // I'm not entirely sure why this happens. Everything seems to work fine as it is, though, so I'll just leave it alone.

        if (this.value instanceof Promise) {
            return await this.value;
        } else if (typeof this.value === 'function') {
            return this.value(data);
        } else return this.value;
    }
}

/**
 * A wrapper for data-based event streams providing continuous
 * updates to the declarativ tree.
 * 
 * @class DataObservable
 */
class DataObservable extends DataResolvable {

	constructor(value) {
		super(value);
		this.listeners = [];
	}

	update() {
		this.listeners.forEach((listener) => listener(this.value));
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}

/**
 * A wrapper for data-based event streams providing continuous
 * updates to the declarativ tree using the js Proxy API.
 * 
 * @class ProxyDataObservable
 */
class ProxyDataObservable extends DataObservable {

	constructor(value) {
		super(value);
		this.proxy = new Proxy(value, {
			set: (obj, prop, val) => {
				this.update();
			},
			deleteProperty: (obj, prop) => {
				this.update();
			}
		});
	}

}

function observe(data) {
	return new ProxyDataObservable(data);
}

/**
 * A set of pending functions to execute at a later
 * point in time.
 *
 * @class PendingTasks
 */
class PendingTasks {
    constructor(tasks) {
        if (tasks instanceof PendingTasks)
            this.tasks = Object.values(tasks.tasks);
        else if (tasks instanceof Array)
            this.tasks = Object.values(tasks);
        else this.tasks = [];
    }

    get length() {
        return this.tasks.length;
    }

    push(fun) {
        this.tasks.push(fun);
        return this;
    }

    async call(...args) {
        return Promise.all(
            this.tasks.map(function(fun) {
                let ret = fun.apply(null, args);
                return ret instanceof Promise ? ret : Promise.resolve();
            })
        );
    }
}

async function forEachAsync(iterable, fun) {
    for (let i in Object.values(iterable))
        await fun(iterable[i], i);
}

module.exports = { DataResolvable, DataObservable, ProxyDataObservable, PendingTasks, forEachAsync, observe };
