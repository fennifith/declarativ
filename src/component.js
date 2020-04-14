const { DataResolvable, DataObservable, PendingTasks, forEachAsync } = require('./util/resolvable.js');
const { escapeHtml } = require('./util/html.js');
const { DOMRender } = require('./render/dom-render.js');
const { StringRender } = require('./render/string-render.js');

function node(variable) {
    if (variable instanceof Node)
        return variable;
    else if (typeof variable === "string") // text string
		return escapeHtml(variable);
	else if (variable instanceof Array) // wrap array of component children
		return new Component(s => s, variable)
	else if (typeof variable === "function" || variable instanceof Promise || variable instanceof DataResolvable) // wrap promised component
		return new Component(s => s, [variable])
	else if (variable === null || typeof variable === "undefined") // null component (throw error on use)
		return new Component(() => { throw "Null component..."; });
    else {
		console.error("declarativ: Cannot resolve passed node: ", variable);
	}
}

function value(variable) {
	if (typeof variable === "function" || variable instanceof Promise)
		return new DataResolvable(variable);
	else return variable;
}

class Node {
    constructor(children) {
		this.children = (children || []).map((child) => value(child));
		this.fallbackState = null;
		this.loadingState = null;
        this.data = new DataResolvable((parentData) => parentData);
    }

    withChildren(...children) {
        return this.withChildrenArray(children);
    }

    withChildrenArray(children) {
        let node = this.clone();
        node.children = children.flat(Infinity).map((child) => value(child));
        return node;
    }

    bind(data) {
        let node = this.clone();
        node.data = new DataResolvable(data);
        return node;
	}
	
	whenError(...nodes) {
		let n = this.clone();
		n.fallbackState = node(nodes);
		return n;
	}

	whenLoading(...nodes) {
		let n = this.clone();
		n.loadingState = node(nodes);
		return n;
	}

	otherwise(...nodes) {
		return this.whenError(nodes);
	}

    clone() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    isBlocking() {
        return this.data.isBlocking();
    }

    /**
     * Iterate over a set of children for all data items passed.
     *
     * @param {Array<Component>} children
     * @returns {Component}
     */
    forEach(...children) {
        return this.withChildren(function(data) { // set children to a function of the passed data
            return Object.values(data).map((item) => children.map(function(child) { // for each item, return all of the passed elements
                if (child instanceof Component)
                    return child.bind(item); // if the child is a component, bind its data directly
                else return new DataResolvable(child).resolve(item); // if the child is another function/promise, resolve it as usual
            }))
        });
    }

    /**
     * Wait for the child elements of a specified component to resolve.
     *
     * @param {Object} data             The resolved data.
     * @returns {Promise<Array>}
     */
    async resolveChildren(data) {
        let children = [];
		
		let arr = Object.values(this.children);
		for (let i = 0; i < arr.length; i++) {
			let value = arr[i];
			if (arr[i] instanceof DataResolvable) {
				if (arr.length == 1) // await promises only if they are an only child
					value = await value.resolve(data);
				else value = value.resolve(data);
			}

			let childNode = node(value);
			if (childNode)
				children.push(childNode);
		}

        return children;
    }

    async renderString(parentData) {
        throw "No renderString implementation";
    }

    /**
     * Render the component and its child elements on the DOM.
     *
     * @param {Object} parentData                   The (resolved) data of the parent element to inherit.
     * @param {jQuery|HTMLElement?} tempElement     The temporary element to replace upon render.
     * @returns {Promise<jQuery|HTMLElement>}
     */
    async render(parentData, tempElement) {
        throw "No render implementation.";
    }
}

/**
 * A representative Component constructed from a template
 * function and a set of data.
 *
 * @param fun {function(string, Object): string}    the HTML function to template with
 * @param data {Object|Promise<Object>}             the data (or promise) to resolve
 * @param children {Array<Object>|Promise<Array>}   inner components to template inside of this one
 * @class Component
 */
class Component extends Node {
    constructor(template, children) {
        super(children);
        this.template = template;
		this.tasks = new PendingTasks();
		this.tasksAfter = new PendingTasks();
		this.observing = false;
		this.rerender = () => {};
    }

    isBlocking() {
        return true; // TODO: allow non-blocking simple components
	}

	isEmptyTemplate() {
		// this isn't a perfect check, but it's probably close enough...
		return this.template("") == "" && this.template.toString().length <= 6;
	}
	
	/**
	 * Calls the passed function on the rendered element after
	 * it is added to the page/DOM.
	 * 
	 * @param {function(HTMLElement|jQuery|string, Object)} fun 
	 * @returns {Component}
	 */
	runAfter(fun) {
		let node = this.clone();
		node.tasks = this.tasks;
		node.tasksAfter = new PendingTasks(this.tasksAfter).push(fun);
		return node;
	}

    /**
     *
     * @param {function(ElementImpl, Object)} fun
     * @returns {Component}
     */
    runWrapped(fun) {
        let node = this.clone();
        node.tasks = new PendingTasks(this.tasks).push(fun);
        return node;
	}

    /**
     * Calls the passed function on the rendered element.
     *
     * @param {function(HTMLElement|jQuery|string, Object)} fun
     * @returns {Component}
     */
    run(fun) {
        return this.runWrapped((e, data) => fun(e.get(), data));
    }

    runWrappedWithValue(value, fun) {
        return this.runWrapped(async function(element, data) {
            return fun(element, await (new DataResolvable(value)).resolve(data));
        })
    }

    runWithValue(value, fun) {
        return this.run(async function(element, data) {
            return fun(element, await (new DataResolvable(value)).resolve(data));
        })
	}
	
	id(value) {
		return this.attr("id", value);
	}

    attr(name, value) {
        return this.runWrappedWithValue(value, (element, resolvedValue) => {
            element.attr(name, resolvedValue);
        });
	}
	
	attrs(value) {
		return this.runWrappedWithValue(value, (element, resolvedValue) => {
			Object.entries(resolvedValue).forEach(([key, val]) => {
				element.attr(key, val);
			});
		});
	}

    className(value) {
        return this.attr("class", value);
    }

    on(event, fun) {
        return this.runWrapped((element) => {
            element.on(event, fun);
        });
    }

    async renderString() {
		return await (new StringRender()).render(null, null, this);
	}

    async render(tempElement) {
		return await (new DOMRender()).render(null, tempElement, this);
    }
}

module.exports = { Component, node };
