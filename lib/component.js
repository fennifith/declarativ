const $ = require('jquery');
const { DataResolvable, PendingTasks } = require('./util.js');

/**
 * Get a somewhat random UID for templating.
 *
 * @returns {string}
 */
function uid() {
    return `render-template-${Math.floor(Math.random() * 1000)}-${Date.now()}`;
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
        this.data = new DataResolvable(data || function(parentData) { return parentData; });
        this.tasks = tasks || new PendingTasks();
        this.children = new DataResolvable(children);
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
        return new Component(this.template, this.data, this.tasks, childrenArray.map((child) => new DataResolvable(child)));
    }

    forEach(...children) {
        return this.with(function(data) {
            return Object.values(data).map((item) => children.map(function(child) {
                if (child instanceof Component)
                    return child.bind(item);
                else return new DataResolvable(child).resolve(item);
            }))
        });
    }

    async resolveChildren(data) {
        let childrenArray = await this.children.resolve(data);
        if (!(childrenArray instanceof Array))
            throw "compose: Children must be specified as an array.";

        let children = [];
        const addChild = async function(child) {
            if (child instanceof DataResolvable)
                await addChild(await child.resolve(data));
            else if (child instanceof Promise)
                await addChild(await child);
            else if (typeof child === "string" || child instanceof Component)
                children.push(child);
            else if (child instanceof Array)
                await Promise.all(Object.values(child).map((c) => addChild(c)));
            else console.error("compose: Cannot handle non-component child; ", child);
        };

        for (let i in childrenArray) {
            await addChild(childrenArray[i]);
        }

        return children;
    }

    async render(parentData, tempElement) {
        // resolve critical data first
        console.log(this);
        let data = await this.data.resolve(parentData);

        // create basic html
        let innerHtml = "";
        let components = {};
        (await this.resolveChildren(data)).forEach((child) => {
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

module.exports = { Component };
