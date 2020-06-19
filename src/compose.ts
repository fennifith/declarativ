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
 * @param component                                     the component to wrap
 * @returns {function(...[Component]=): (Component|o)}  the composed function
 */
export function wrapCompose(component: Component) {
    return function(...children: ResolvableNode[]) {
        return component.withChildrenArray(children);
    };
}

/**
 * Shorthand for creating a new Component instance.
 *
 * @param template {function(string, Object): string}   the HTML function to template with
 * @return {function(Object): Component}                a Component function
 */
export function compose(template: (inner: string, data: any) => string) {
    return wrapCompose(new Component(template));
}
