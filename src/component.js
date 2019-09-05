const $ = require('jquery');
const { DataResolvable, PendingTasks, forEachAsync, escapeHtml } = require('./util.js');

function resolveNode(variable) {
    if (variable instanceof Node)
        return variable;
    else if (typeof variable == "string")
        return new TextNode(variable);
    else throw "declarativ: Cannot resolve passed node: " + variable;
}

class Node {
    constructor(children) {
        this.children = (children || []).map((child) => new DataResolvable(child));
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
        let addChild = async function(resolvable) {
            let child = await resolvable.resolve(data);

            if (child instanceof Array) { // flatten inner arrays
                await Promise.all(Object.values(child).map((c) => addChild(new DataResolvable(c))));
            } else children.push(resolveNode(child));
        };

        console.log(this.children);
        await Promise.all(Object.values(this.children).map(addChild));

        return children;
    }

    async renderString(parentData) {
        throw "No renderString implementation";
    }

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
        let element = $(document.createTextNode(this.text));
        if (tempElement) {
            element.insertBefore(tempElement);
            tempElement.remove();
        }

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
    }

    /**
     * Calls the passed function on the rendered element.
     *
     * @param {function(Element)} fun
     * @returns {Component}
     */
    run(fun) {
        let node = this.clone();
        node.tasks = new PendingTasks(this.tasks).push(fun);
        return node;
    }

    async renderString(parentData) {
        // resolve critical data first
        let data = await this.data.resolve(parentData);

        // create basic html
        let innerHtml = "";
        await forEachAsync(await this.resolveChildren(data), async function(child) {
            innerHtml += await child.renderString(parentData);
        });

        // render HTML structure
        return this.template(innerHtml, data);
    }

    /**
     * Render the component and its child elements on the DOM.
     *
     * @param {Object} parentData                   The (resolved) data of the parent element to inherit.
     * @param {jQuery|HTMLElement} tempElement      The temporary element to replace upon render.
     * @returns {Promise<jQuery|HTMLElement>}
     */
    async render(parentData, tempElement) {
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
            } else innerHtml += await child.renderString(parentData);
        });

        console.log(innerHtml);

        // render HTML structure
        let element = $(this.template(innerHtml, data));
        await this.tasks.call(element, data);
        if (tempElement) {
            element.insertBefore(tempElement);
            tempElement.remove();
        }

        // render / await child nodes
        await Promise.all(Object.keys(components).map(function(id) {
            let temp = element.find(`template#${id}`);
            return components[id].render(data, temp);
        }));

        return element;
    }
}

module.exports = { Component };
