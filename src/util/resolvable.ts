/**
 * Useful data-handling classes and functions.
 *
 * @module util/resolvable
 */

export type ResolvableValue<T> = T | ((data: any) => ResolvableValue<T>) | Promise<ResolvableValue<T>>

/**
 * A wrapper class for data-based promises and/or arbitrary
 * values that enter a component.
 *
 * @property {Object|function(Object): Object|Promise<Object>}
 * @class DataResolvable
 */
export class DataResolvable<T> {

	value: ResolvableValue<T>;

    constructor(value: ResolvableValue<T>) {
        if (value instanceof DataResolvable)
            this.value = value.value;
        else this.value = value;
    }

    isBlocking() {
        return this.value instanceof Promise || typeof this.value === 'function';
    }

    async resolve(data?: any) {
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
export class DataObservable<T> extends DataResolvable<T> {

	listeners: ((value: T) => void)[]

	constructor(value: T) {
		super(value);
		this.listeners = [];
	}

	update(value: T) {
		this.value = value;
		this.listeners.forEach((listener) => listener(this.value));
	}

	subscribe(listener: (value: T) => void) {
		this.listeners.push(listener);
	}

	unsubscribe(listener: (value: T) => void) {
		if (this.listeners.includes(listener))
			this.listeners.splice(this.listeners.indexOf(listener), 1);
	}

}

/**
 * A wrapper for data-based event streams providing continuous
 * updates to the declarativ tree using the js Proxy API.
 * 
 * @class ProxyDataObservable
 */
export class ProxyDataObservable<T> extends DataObservable<T> {

	proxy: Proxy;

	constructor(value: T) {
		super(value);
		this.proxy = new Proxy(value || {}, {
			set: (obj, prop, val) => {
				this.value[prop] = val;
				this.update(this.value);
				return true;
			},
			deleteProperty: (obj, prop) => {
				delete this.value[prop];
				this.update(this.value);
				return true;
			}
		});
	}

}

export function observe(data: any) {
	return new ProxyDataObservable(data);
}

export function resolvable<T>(value: ResolvableValue<T>) : DataResolvable<T> | T {
	// TODO: rx support?
	if (value instanceof Promise || typeof value === 'function')
		return new DataResolvable(value);
	else return value;
}

export async function resolve<T>(value: ResolvableValue<T>, data?: any) : Promise<T> {
	let obj = resolvable(value);
	if (obj instanceof DataResolvable)
		return await obj.resolve(data);
	else return obj;
}

/**
 * A set of pending functions to execute at a later
 * point in time.
 *
 * @class PendingTasks
 */
export class PendingTasks {

	tasks: ((...args: any[]) => void)[];

    constructor(tasks?: PendingTasks | ((...args: any[]) => void)[]) {
        if (tasks instanceof PendingTasks)
            this.tasks = tasks.tasks;
        else if (tasks instanceof Array)
            this.tasks = tasks;
        else this.tasks = [];
    }

    get length() {
        return this.tasks.length;
    }

    push(fun: (...args: any[]) => void) {
        this.tasks.push(fun);
        return this;
    }

    async call(...args: any[]) {
        return Promise.all(
            this.tasks.map(function(fun) {
                let ret = fun.apply(null, args);
                return ret instanceof Promise ? ret : Promise.resolve();
            })
        );
    }
}

export async function forEachAsync<T>(iterable: T[], fun: (item: T, index: number) => void) {
	await iterable.reduce((promise, item, index) => {
		return promise.then(() => fun(item, index));
	}, Promise.resolve());
}
