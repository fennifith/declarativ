import { Component, Element } from "../component";
import { DataObservable, resolve } from '../util/resolvable';

export interface RenderOpts {
	debugLogger?: (...data: any[]) => void
	strict?: boolean
}

export abstract class Render<E> {

	opts: RenderOpts

	constructor(opts?: RenderOpts) {
		this.opts = opts || {}
	}

	/**
	 * Base/wrapped render function (calls doRender with conditions)
	 * 
	 * @param {*} parentData 
	 * @param {*} tempElement 
	 * @param {*} component 
	 */
	async render(parentData: any, tempElement: E | null, component: Component) : Promise<E> {
		try {
			this.opts.debugLogger?.(`Rendering component ${component.template}`)

			// render loading state first... (if present)
			if (component.loadingState) {
				tempElement = await this.render(null, tempElement, await resolve(component.loadingState));
			}

			// resolve critical data first
			let data = component.data ? await resolve(component.data, parentData) : parentData;
			this.opts.debugLogger?.('  Resolved data:', data);

			// perform actual render
			let element = await this.doRender(data, tempElement, component);
			this.opts.debugLogger?.('  Finished render:', element);

			if (component.data instanceof DataObservable) {
				// subscribe to observable changes
				component.data.subscribe(async (newData) => {
					element = await this.doRender(newData, element, component);
				});
			}

			return element;
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
	abstract async doRender(parentData: any, tempElement: E | null, component: Component) : Promise<E>

}
