const { Render } = require('./render.js');
const { forEachAsync } = require('../util/resolvable.js');
const dom = require('../util/dom-wrapper.js');

class StringRender extends Render {

	constructor(opts) {
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
	async doRender(parentData, tempElement, component) {
		// resolve critical data first
		let data = await component.data.resolve(parentData);

		// create basic html
		let innerHtml = "";
		await forEachAsync(await component.resolveChildren(data), async (child) => {
			if (typeof child === "string")
				innerHtml += child;
			else innerHtml += await this.render(data, null, child);
		});
 
		// TODO: support attribute values / this.tasks.call() on string returns
 
		// render HTML structure
		let str = component.template(innerHtml, data);
		let strImpl = dom.element(str);
		await component.tasks.call(strImpl, data);
		return strImpl.get();
	}

}

module.exports = { Render, StringRender };
