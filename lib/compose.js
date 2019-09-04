/**
 * Creates a simple declarative component-based data binding
 * functionality for small HTML documents.
 *
 * @module compose/index
 */

const $ = require('jquery');
const { Component } = require('./component.js');

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

