

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

    async resolve(data) {
        // TODO: ideally, Promises/functions should resolve recursively (e.g. Promises that return a function), but this breaks the Component's forEach functionality
        if (this.value instanceof Promise) {
            return await this.value;
        } else if (typeof this.value === 'function') {
            return this.value(data);
        } else return this.value;
    }
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

    push(fun) {
        this.tasks.push(fun);
        return this;
    }

    call(...args) {
        this.tasks.forEach((fun) => {
            fun.apply(null, args);
        });
    }
}

module.exports = { DataResolvable, PendingTasks };
