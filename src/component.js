const { DataResolvable, DataObservable, PendingTasks, forEachAsync } = require('./util/resolvable.js');
const { escapeHtml } = require('./util/html.js');
const dom = require('./util/dom-wrapper.js');

function node(variable) {
    if (variable instanceof Node)
        return variable;
    else if (typeof variable === "string")
		return new TextNode(variable);
	else if (typeof variable === "function" || variable instanceof Promise || variable instanceof Array)
		return new Component(s => s, variable)
	else if (variable === null || typeof variable === "undefined")
		return null;
    else {
		console.error("declarativ: Cannot resolve passed node: ", variable);
	}
}

class Node {
    constructor(children) {
		this.children = (children || []).map((child) => new DataResolvable(child));
		this.fallback = null;
        this.data = new DataResolvable((parentData) => parentData);
    }

    withChildren(...children) {
        return this.withChildrenArray(children);
    }

    withChildrenArray(children) {
        let node = this.clone();
        node.children = children.map((child) => new DataResolvable(child));
        return node;
    }

    bind(data) {
        let node = this.clone();
        node.data = new DataResolvable(data);
        return node;
	}
	
	otherwise(...nodes) {
		this.fallback = node(nodes);
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
			let childNode = node(await arr[i].resolve(data));
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

class TextNode extends Node {
    constructor(text) {
        super();
        this.text = text;
    }

    isBlocking() {
        return false;
    }

    async renderString(parentData) {
        return escapeHtml(this.text);
    }

    async render(parentData, tempElement) {
        let element = dom.createText(this.text);
        if (tempElement)
            dom.element(tempElement).replaceWith(element);

        return element;
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

    async renderString(parentData) {
		try {
			// resolve critical data first
			let data = await this.data.resolve(parentData);

			// create basic html
			let innerHtml = "";
			await forEachAsync(await this.resolveChildren(data), async function(child) {
				innerHtml += await child.renderString(data);
			});
	 
			// TODO: support attribute values / this.tasks.call() on string returns
	 
			// render HTML structure
			let str = this.template(innerHtml, data);
			let strImpl = dom.element(str);
			await this.tasks.call(strImpl, data);
			return strImpl.get();
		} catch (e) {
			if (this.fallback)
				return this.fallback.bind(e).renderString(parentData)
			else throw e;
		}
	}
	
	async renderElement(parentData, tempElement) {
		// resolve critical data first
        let data = await this.data.resolve(parentData);

        // create basic html
        let innerHtml = "";
        let components = {};
        await forEachAsync(await this.resolveChildren(data), async function(child) {
            if (child.isBlocking()) {
                let id = `render-${Math.floor(Math.random() * 1000)}-${Date.now()}`;
                innerHtml += `<template id="${id}"></template>`;
                components[id] = child;
            } else innerHtml += await child.renderString(data);
        });

        // render HTML structure
        let element = dom.createHtml(this.template(innerHtml, data));
        let elementImpl = dom.element(element);
        await this.tasks.call(elementImpl, data);
        if (tempElement)
            dom.element(tempElement).replaceWith(element);

        // render / await child nodes
        await Promise.all(Object.keys(components).map(function(id) {
            let temp = elementImpl.find(`template#${id}`);
            return components[id].render(data, temp);
		}));
		
		await this.tasksAfter.call(element, data);

		return element;
	}

    async render(parentData, tempElement) {
		let element = null;
		try {
			element = await this.renderElement(parentData, tempElement);
		} catch (e) {
			if (this.fallback)
				await this.fallback.bind(e).render(parentData, tempElement);
			else throw e;
		}

		this.rerender = function() {
			// re-render the element on observable change
			this.render(parentData, element);
		};

        return element;
    }
}

module.exports = { Component, node };
