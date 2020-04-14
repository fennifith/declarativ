class Render {

	constructor(opts) {
		// TODO: potential "strict" opt (don't catch errors)
	}

	/**
	 * Base/wrapped render function (calls doRender with conditions)
	 * 
	 * @param {*} parentData 
	 * @param {*} tempElement 
	 * @param {*} component 
	 */
	async render(parentData, tempElement, component) {
		try {
			// render loading state first... (if present)
			if (component.loadingState) {
				tempElement = await this.render(null, tempElement, component.loadingState);
			}

			// perform actual render
			return await this.doRender(parentData, tempElement, component);
		} catch (e) {
			// fallback component (if present)
			if (component.fallbackState)
				return await this.render(e, tempElement, component.fallbackState);
			else throw e;
		}
	}

	/**
	 * Perform a recursive render... thing...
	 * 
	 * @param {*} parentData - The current data object to bind to components.
	 * @param {HTMLElement|ElementImpl?} tempElement - The element/object that components should replace.
	 * @param {Component} component - The component to start the render at.
	 * @return {*} The rendered item.
	 */
	async doRender(parentData, tempElement, component) {
		throw "No implementation.";
	}

}

module.exports = { Render };
