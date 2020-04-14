/**
 * Creates a simple declarative component-based data binding
 * functionality for small HTML documents.
 *
 * @module compose/index
 */

const dom = require('./util/dom-wrapper.js');
const { Component } = require('./component.js');

/**
 * Wrap a component in a composition function.
 *
 * @param component                                     the component to wrap
 * @returns {function(...[Component]=): (Component|o)}  the composed function
 */
function wrapCompose(component) {
    return function(...children) {
        return component.withChildrenArray(children);
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

module.exports = {Component, wrapCompose, compose};

