import { Render, RenderOpts } from './render';
import { forEachAsync } from '../util/resolvable';
import * as dom from '../util/dom-wrapper';
import { Component } from '../component';

let nodeCount = 0;

export class DOMRender extends Render<Node> {

	constructor(opts?: RenderOpts) {
		super(opts);
	}

	/**
	 * Perform a recursive render... thing...
	 * 
	 * @param {*} data - The current data object to bind to components.
	 * @param {Node|ElementImpl?} tempElement - The element/object that components should replace.
	 * @param {Component} component - The component to start the render at.
	 * @return {*} The rendered item.
	 */
	async doRender(data: any, tempElement: Node | null, component: Component) : Promise<Node> {
        // create basic html
        let innerHtml = "";
        let components: {[id: string]: Component} = {};
		await forEachAsync(await component.resolveChildren(data), async (child, index) => { 
			if (typeof child === "string") {
				innerHtml += child;
			} else {
            	let id = `decl-${nodeCount++}-${index}`;
				innerHtml += `<template id="${id}"></template>`;
				components[id] = child;
			}
		});

		this.opts.debugLogger?.("  Resolved child elements:", innerHtml);

        // render HTML structure
		let elements = dom.createHtml(component.template(innerHtml, data));
		let elementImpl = dom.element(elements[0]);

		// call immediate tasks (attributes, etc.)
		await component.tasks.call(elementImpl, data);
		
		let tempElementImpl = dom.element(tempElement);
        if (tempElementImpl) { // replace tempElement on dom
			tempElementImpl.replaceWith(elements[0]);
			if (!elements[0].parentNode)
				throw "No parent node on element " + elements[0];

			for (let i = 1; i < elements.length; i++) {
				// insert any additional nodes into the DOM (in case the template is weird)
				dom.element(elements[0].parentNode)?.insertAfter(elements[i], elements[i-1]);
			}
		}

        // render / await child nodes
        await Promise.all(Object.keys(components).map(async (id) => {
			let temp = document.querySelector(`#${id}`);
			if (!temp || !(temp instanceof HTMLElement))
				throw `couldn't find child ${id}`;
			
			let result = await this.render(data, temp, components[id]);
			for (let i = 0; i < elements.length; i++) {
				// account for stray elements in template (see large comment block below)
				let element = elements[i];
				if (element instanceof HTMLElement && element.id === id)
					elements[i] = result;
			}
		}));
		
		await Promise.all(elements.map((element) => component.tasksAfter.call(element, data)));

		// Only returning the first element makes it possible for some to
		// potentially "leak" from the tree. As such, multi-element nodes should
		// be discouraged (for now...)
		//
		// This could be worked around in the future by writing a `dom-wrapper`
		// implementation for arrays that modifies each element in the array;
		// `element.replace(...)` would replace the first element and remove all
		// others, etc.
		return elements[0];
	}

}
