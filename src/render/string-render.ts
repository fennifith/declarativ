import { Component } from '../component';
import { Render, RenderOpts } from './render';
import { forEachAsync } from '../util/resolvable';
import { element } from '../util/dom-wrapper';

export class StringRender extends Render<string> {

	constructor(opts?: RenderOpts) {
		super(opts);
	}

	/**
	 * Perform a recursive render... thing...
	 * 
	 * @param {*} parentData - The current data object to bind to components.
	 * @param {HTMLElement|ElementImpl?} tempElement - The element/object that components should replace.
	 * @param {Component} component - The component to start the render at.
	 * @return {String} The rendered string.
	 */
	async doRender(data: any, tempElement: string | null, component: Component) : Promise<string> {
		// create basic html
		let innerHtml = "";
		await forEachAsync(await component.resolveChildren(data), async (child) => {
			if (typeof child === "string")
				innerHtml += child;
			else innerHtml += await this.render(data, null, child);
		});

		this.opts.debugLogger?.("  Resolved child elements:", innerHtml);
 
		// TODO: support attribute values / this.tasks.call() on string returns
 
		// render HTML structure
		let str = component.template(innerHtml, data);
		let strImpl = element(str);
		await component.tasks.call(strImpl, data);
		
		if (strImpl)
			return strImpl.get();
		else throw "Error occurred: null string";
	}

}
