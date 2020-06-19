import { Component, Element } from "../component";
import { DataObservable, resolve } from '../util/resolvable';

export interface RenderOpts {
}

export abstract class Render<E> {

	constructor(opts?: RenderOpts) {
		// TODO: potential "strict" opt (don't catch errors)
	}

	/**
	 * Base/wrapped render function (calls doRender with conditions)
	 * 
	 * @param {*} parentData 
	 * @param {*} tempElement 
	 * @param {*} component 
	 */
	async render(parentData: any, tempElement: E, component: Component) : Promise<E> {
		try {
			// render loading state first... (if present)
			if (component.loadingState) {
				tempElement = await this.render(null, tempElement, await resolve(component.loadingState));
			}

			// resolve critical data first
			let data = component.data ? await component.data.resolve(parentData) : parentData;

			// perform actual render
			let element = await this.doRender(data, tempElement, component);

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
	abstract async doRender(parentData: any, tempElement: E, component: Component) : Promise<E>

}
