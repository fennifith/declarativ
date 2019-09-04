

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
        if (this.value instanceof Promise) {
            this.value = await this.value;
            return await this.resolve(data);
        } else if (typeof this.value === 'function') {
            this.value = this.value(data);
            return await this.resolve(data);
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
