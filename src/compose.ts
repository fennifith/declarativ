/**
 * Creates a simple declarative component-based data binding
 * functionality for small HTML documents.
 *
 * @module compose/index
 */

import { Component, ResolvableNode } from './component';

/**
 * Wrap a component in a composition function.
 *
 * @param {Component} component - the component to wrap
 * @returns {function(...[ResolvableNode]): Component} - the composed function
 */
export function wrapCompose(component: Component) : (children: ResolvableNode[]) => Component {
	return function(...children: ResolvableNode[]) {
		return component.withChildrenArray(children);
	};
}

/**
 * Shorthand for creating a new Component instance.
 *
 * @param {function(string, any): string} template - the HTML function to template with
 * @return {function(...[ResolvableNode]): Component} - a Component function
 */
export function compose(template: (inner: string, data: any) => string) : (...children: ResolvableNode[]) => Component {
	return function(...children: ResolvableNode[]) {
		return new Component(template, children);
	}
}
