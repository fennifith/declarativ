/**
 * Creates a simple declarative component-based data binding
 * functionality for small HTML documents.
 *
 * @module compose/index
 */

const $ = require('jquery');

/**
 * Get a somewhat random UID for templating.
 *
 * @returns {string}
 */
function uid() {
    return `render-template-${Math.floor(Math.random() * 1000)}-${Date.now()}`;
}

/**
 * A wrapper classes for data-based promises and/or arbitrary
 * values that enter a component.
 *
 * @property {Object|function(Object): Object|Promise<Object>}
 * @class PromisedValue
 */
class PromisedValue {
    constructor(value) {
        if (value instanceof PromisedValue)
            this.value = value.value;
        else this.value = value;
    }

    async resolve(data) {
        if (this.value instanceof Promise)
            return await this.value;
        else if (typeof this.value === 'function')
            return this.value(data);
        else return this.value;
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

/**
 * A representative Component constructed from a template
 * function and a set of data.
 *
 * @param fun {function(string, Object): string}    the HTML function to template with
 * @param data {Object|Promise<Object>}             the data (or promise) to resolve
 * @param children {Array<Object>|Promise<Array>}   inner components to template inside of this one
 * @class Component
 */
class Component {
    constructor(templateFun, data, tasks, children) {
        this.template = templateFun;
        this.data = new PromisedValue(data || function(parentData) { return parentData; });
        this.tasks = tasks || new PendingTasks();
        this.children = new PromisedValue(children);
    }

    bind(data) {
        return new Component(this.template, data, this.tasks, this.children);
    }

    attr(name, value) {
        let attrs = Object.assign({}, data['$attrs']);
        attrs[name] = value;

        return this.attrs(attrs);
    }

    attrs(attrs) {
        return this.run((element) => {
            for (let attr in attrs)
                element.attr(attr, attrs[attr]);
        })
    }

    className(className) {
        return this.attrs({ 'class': className })
    }

    on(event, callback) {
        return this.run((element) => element.on(event, callback));
    }

    run(fun) {
        let tasks = new PendingTasks(this.tasks).push(fun);
        return new Component(this.template, this.data, tasks, this.children);
    }

    with(...children) {
        return this.withArray(children);
    }

    withArray(childrenArray) {
        return new Component(this.template, this.data, this.tasks, childrenArray);
    }

    async resolveChildren(data) {
        let children = await this.children.resolve(data);
        if (!(children instanceof Array))
            throw "compose: Children must be specified as an array.";

        return children.map(function(child) {
            // verify that each child is a Component before returning
            if (typeof child === "string" || child instanceof Component) // handle inline strings as child nodes
                return child;
            else {
                console.error("compose: Cannot handle non-component child; ", child);
                return compose(() => `<span></span>`)(); // placeholder stub component which renders to nothing
            }
        });
    }

    async render(parentData, tempElement) {
        // resolve critical data first
        console.log(this);
        let data = await this.data.resolve(parentData);

        // create basic html
        let innerHtml = "";
        let components = {};
        (await this.resolveChildren()).forEach((child) => {
            if (typeof child === "string") // strings are fine
                innerHtml += child;
            else if (child instanceof Component) { // replace components with temporary elements
                let id = uid();
                innerHtml += `<template id="${id}"></template>`;
                components[id] = child;
            }
        });

        // render HTML structure
        let element = $(this.template(innerHtml, data));
        this.tasks.call(element);
        if (tempElement) {
            element.insertBefore(tempElement);
            tempElement.remove();
        }

        console.log(element);

        // render / await child nodes
        await Promise.all(Object.keys(components).map(function(id) {
            let temp = element.find(`template#${id}`);
            return components[id].render(data, temp);
        }));

        return element;
    }
}

/**
 * Wrap a component in a composition function.
 *
 * @param component                                     the component to wrap
 * @returns {function(...[Component]=): (Component|o)}  the composed function
 */
function wrapCompose(component) {
    return function(...children) {
        return component.withArray(children);
    };
}

/**
 * Shorthand for creating a new Component instance.
 *
 * @param template {function(string, Object): string}   the HTML function to template with
 * @return {function(Object): Component}                a Component function
 */
function compose(template) {
    return wrapCompose(new Component(template));
}

/**
 * Render all components to an element on the HTML DOM.
 *
 * @param {Component} component                     the root component to render
 * @param {Element} tempElement                     the template element that this render should replace
 * @returns {Promise<string>}                       the rendered jQuery element
 */
async function render(component, tempElement) {
    console.log('rendering', component);
    return component.render(null, tempElement);
}

/**
 * Render all components to the #page element.
 *
 * @param element                                   a jQuery element
 * @param {Component} component                     the root component to render
 * @returns {Promise}                               arbitrary promise resolved upon completion
 */
async function renderElement(element, component) {
    let template = $(`<template></template>`);
    element.empty();
    element.append(template);

    return render(component, template);
}

module.exports = {Component, wrapCompose, compose, render, renderElement};

