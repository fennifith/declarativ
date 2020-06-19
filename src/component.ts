import { ResolvableValue, DataResolvable, DataObservable, PendingTasks, resolvable } from './util/resolvable';
import { ElementImpl } from './util/dom-wrapper';
import { escapeHtml } from './util/html';
import { DOMRender } from './render/dom-render';
import { StringRender } from './render/string-render';
import { RenderOpts } from './render/render';

export type Node = Component | string
export type ResolvableNode = ResolvableValue<Node | ResolvableNode[]>

export type Element = HTMLElement | string

export function node(variable: any) : Component {
    if (variable instanceof Component)
        return variable;
    else if (typeof variable === "string") // text string
		return new Component(() => escapeHtml(variable));
	else if (variable instanceof Array) // wrap array of component children
		return new Component((s: any) => s, variable)
	else if (typeof variable === "function" || variable instanceof Promise || variable instanceof DataResolvable) // wrap promised component
		return new Component((s: any) => s, [variable])
	else if (variable === null || typeof variable === "undefined") // null component (throw error on use)
		return new Component(() => { throw "Null component..."; });
    else {
		console.error("declarativ: Cannot resolve passed node: ", variable);
	}
}

/**
 * A representative Component constructed from a template
 * function and a set of data.
 *
 * @param fun {function(string, Object): string}    the HTML function to template with
 * @param data {Object|Promise<Object>}             the data (or promise) to resolve
 * @param children {Array<Object>|Promise<Array>}   inner components to template inside of this one
 * @class Component
 */
export class Component {

	children: ResolvableNode[]
	fallbackState: Component
	loadingState: Component

	data: any
	template: (inner: string, data?: any) => string

	tasks: PendingTasks
	tasksAfter: PendingTasks

	observing: boolean
	rerender: () => void

    constructor(template: ((inner: string, data?: any) => string), children?: ResolvableNode[]) {
		this.children = children || [];
		this.fallbackState = null;
		this.loadingState = null;
        this.data = null;
        this.template = template;
		this.tasks = new PendingTasks();
		this.tasksAfter = new PendingTasks();
		this.observing = false;
		this.rerender = () => {};
	}
	
    withChildren(...children: ResolvableNode[]) : Component {
        return this.withChildrenArray(children);
    }

    withChildrenArray(children: ResolvableNode[]) : Component {
		let node = this.clone();
        node.children = children.flat(Infinity).map((child) => resolvable(child));
        return node;
    }

    bind(data: any) : Component {
        let node = this.clone();
        node.data = resolvable(data);
        return node;
	}
	
	whenError(...nodes: ResolvableNode[]) : Component {
		let n = this.clone();
		n.fallbackState = node(nodes);
		return n;
	}

	whenLoading(...nodes: ResolvableNode[]) : Component {
		let n = this.clone();
		n.loadingState = node(nodes);
		return n;
	}

	otherwise(...nodes: ResolvableNode[]) : Component {
		return this.whenError(nodes);
	}

    clone() : Component {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    isBlocking() : boolean {
        return true; // TODO: allow non-blocking simple components
    }

    /**
     * Iterate over a set of children for all data items passed.
     *
     * @param {Array<Component>} children
     * @returns {Component}
     */
    forEach(...children: ResolvableNode[]) : Component {
        return this.withChildren(function(data): ResolvableNode { // set children to a function of the passed data
            return Object.keys(data).map((key): ResolvableNode => children.map(function(child) { // for each item, return all of the passed elements
                if (child instanceof Component)
                    return child.bind(data[key]); // if the child is a component, bind its data directly
                else return new DataResolvable(child).resolve(data[key]); // if the child is another function/promise, resolve it as usual
            }))
        });
    }

    /**
     * Wait for the child elements of a specified component to resolve.
     *
     * @param {Object} data             The resolved data.
     * @returns {Promise<Array>}
     */
    async resolveChildren(data: any) : Promise<Node[]> {
        let children = [];
		
		let arr = this.children.flat(Infinity);
		for (let i = 0; i < arr.length; i++) {
			let value = arr[i];
			if (arr[i] instanceof DataResolvable) {
				value = await value.resolve(data);
			}

			if (value instanceof Array) {
				// flatten inner arrays (avoid creating unnecessary nodes)
				value.flat(Infinity).forEach((item) => {
					children.push(node(item));
				});
			} else children.push(node(value));
		}

        return children;
    }

	isEmptyTemplate() : boolean {
		// this isn't a perfect check, but it's probably close enough...
		return this.template("") === "" && this.template.toString().length <= 6;
	}
	
	/**
	 * Calls the passed function on the rendered element after
	 * it is added to the page/DOM.
	 * 
	 * @param {function(HTMLElement|jQuery|string, Object)} fun 
	 * @returns {Component}
	 */
	runAfter(fun: (e: Element, data: any) => void) : Component {
		let node = this.clone();
		node.tasks = this.tasks;
		node.tasksAfter = new PendingTasks(this.tasksAfter).push(fun);
		return node;
	}

    /**
     *
     * @param {function(ElementImpl, Object)} fun
     * @returns {Component}
     */
    runWrapped(fun: (e: ElementImpl<Element>, data: any) => void) : Component {
        let node = this.clone();
        node.tasks = new PendingTasks(this.tasks).push(fun);
        return node;
	}

    /**
     * Calls the passed function on the rendered element.
     *
     * @param {function(HTMLElement|jQuery|string, Object)} fun
     * @returns {Component}
     */
    run(fun: (e: Element, data: any) => void) : Component {
        return this.runWrapped((e, data) => fun(e.get(), data));
    }

    runWrappedWithValue<T>(value: ResolvableValue<T>, fun: (e: ElementImpl<Element>, data: T) => void) : Component {
        return this.runWrapped(async function(element, data): Promise<any> {
            return fun(element, await (new DataResolvable(value)).resolve(data));
        })
    }

    runWithValue<T>(value: ResolvableValue<T>, fun: (e: Element, data: T) => void) : Component {
        return this.run(async function(element, data): Promise<any> {
            return fun(element, await (new DataResolvable(value)).resolve(data));
        })
	}
	
	id(value: ResolvableValue<string>) : Component {
		return this.attr("id", value);
	}

    attr(name: string, value: ResolvableValue<string>) : Component {
        return this.runWrappedWithValue(value, (element, resolvedValue) => {
            element.attr(name, resolvedValue);
        });
	}
	
	attrs(values: { [name: string]: ResolvableValue<string> }) : Component {
		return Object.keys(values).reduce((component: Component, key: string) => {
			return component.attr(key, values[key]);
		}, this);
	}

    className(value: ResolvableValue<string>) : Component {
        return this.attr("class", value);
    }

    on(event: string, callback: (e: Event) => void) : Component {
        return this.runWrapped((element) => {
            element.on(event, callback);
        });
    }

    async renderString(opts?: RenderOpts) : Promise<string> {
		return await (new StringRender(opts)).render(null, null, this);
	}

	/**
     * Render the component and its child elements on the DOM.
     *
     * @param {Object} parentData                   The (resolved) data of the parent element to inherit.
     * @param {HTMLElement?} tempElement     The temporary element to replace upon render.
     * @returns {Promise<HTMLElement>}
     */
    async render(tempElement: HTMLElement, opts?: RenderOpts) : Promise<HTMLElement> {
		return await (new DOMRender(opts)).render(null, tempElement, this);
    }
}
