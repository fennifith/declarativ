/**
 * Wraps DOM functions to abstract them
 * from the rest of the library.
 *
 * @module dom/dom-wrapper
 */

/**
 * Base element implementation class.
 *
 * @class ElementImpl
 */
export abstract class ElementImpl<E> {

	element: E

    constructor(element: E) {
		this.element = element;
    }

    attr(name: string, value?: string) : string | null {
        if (value) {
			this.setAttr(name, value);
			return value;
		} else return this.getAttr(name);
    }

    abstract getAttr(name: string) : string | null

    abstract setAttr(name: string, value: string) : void

    get className() : string | null {
        return this.getClassName();
    }

    set className(value: string | null) {
        this.setClassName(value || "");
    }

    getClassName() : string | null {
        return this.getAttr("class");
    }

    setClassName(value: string) {
        this.setAttr("class", value);
    }

    abstract on(event: string, callback: (event: Event) => void) : void

    /**
     * Inserts one element before another inside
     * of the element that it is called upon.
     *
     * @param {HTMLElement} other    The element to insert
     * @param {HTMLElement} ref      The reference/index element to insert
     *                                      `other` before.
     */
    abstract insertBefore(other: E, ref: E) : void
	
	/**
     * Inserts one element after another inside
     * of the element that it is called upon.
     *
     * @param {HTMLElement} other    The element to insert
     * @param {HTMLElement} ref      The reference/index element to insert
     *                                      `other` after.
     */
    abstract insertAfter(other: E, ref: E) : void

    /**
     * Remove the element from the DOM.
     */
    abstract remove() : void

    /**
     * Replace the element with another.
     *
     * @param {HTMLElement} other        The element to replace it with.
     * @param {HTMLElement?} parent      The parent element to replace inside.
     */
    abstract replaceWith(other: E, parent?: E) : void

    /**
     * Find a specific element inside of another.
     *
     * @param {string} selector                 The selector string to query.
     */
    abstract find(selector: string) : E|null

    /**
     * Append a child node to the current
     *
     * @param {HTMLElement} child        The node to append.
     */
    abstract appendChild(child: E) : void

    /**
     * Clear all child nodes from the element.
     */
    abstract empty() : void

    get() : E {
        return this.element;
    }
}

/**
 * The most hacky and basic possible implementation
 * for string HTML parsing / manipulation.
 *
 * @class StringElementImpl
 */
class StringElementImpl extends ElementImpl<string> {

	attrs: { [key: string]: string }

    constructor(element: string) {
        super(element);
        this.attrs = {};
    }

    setAttr(name: string, value: string) {
        this.attrs[name] = value;
    }

    getAttr(name: string) : string {
        return this.attrs[name];
	}

	on(event: string, callback: (event: Event) => void) {
		throw "No .on implementation!";
	}

	find(selector: string): string {
		throw "No .find implementation!";
	}
	
	appendChild(element: string) {
		throw "No .appendChild implementation!";
	}

    insertBefore(other: string, ref: string) : void {
		throw "No .insertBefore implementation!";
	}
	
    insertAfter(other: string, ref: string) : void {
		throw "No .insertAfter implementation!";
	}

	remove() {
		throw "No .remove implementation!";
	}

	replaceWith(other: string, parent?: string) : void {
		throw "No .replaceWith implementation!";
	}

	empty() {
		throw "No .empty implementation!";
	}

    get() : string {
        let index = this.element.indexOf(">");
        return this.element.slice(0, index)
            + Object.keys(this.attrs).map((key) => ` ${key}="${this.attrs[key]}"`)
            + this.element.slice(index);
    }
}

/**
 * Implementation for HTML nodes.
 *
 * @class HTMLNodeImpl
 */
class HTMLNodeImpl extends ElementImpl<Node> {

    constructor(element: Node) {
        super(element);
    }

    setAttr(name: string, value: string) {
        throw "No .setAttr implementation!";
    }

    getAttr(name: string) : string | null {
        throw "No .getAttr implementation!";
    }

    on(event: string, callback: (e: Event) => void) {
        this.element.addEventListener(event, callback);
    }

    insertBefore(other: Node, ref: Node) {
        this.element.insertBefore(other, ref);
	}
	
	insertAfter(other: Node, ref: Node) {
		if (ref.nextSibling)
			this.insertBefore(other, ref.nextSibling)
		else this.appendChild(other);
    }

    remove() {
        throw "No .remove implementation!";
    }

    replaceWith(other: Node, parent: Node) {
        if (parent)
            parent.replaceChild(other, this.element);
        else throw "Cannot replace element; no parent defined.";
    }

    find(selector: string): Node | null {
		return null;
    }

    appendChild(child: Node) {
        this.element.appendChild(child);
    }

    empty() {
        while (this.element.firstChild)
            this.element.removeChild(this.element.firstChild);
    }
}

/**
 * Implementation for HTML elements.
 *
 * @class HTMLElementImpl
 */
class HTMLElementImpl extends ElementImpl<HTMLElement> {

    constructor(element: HTMLElement) {
        super(element);
    }

    setAttr(name: string, value: string) {
        this.element.setAttribute(name, value);
    }

    getAttr(name: string) : string | null {
        return this.element.getAttribute(name);
    }

    on(event: string, callback: (e: Event) => void) {
        this.element.addEventListener(event, callback);
    }

    insertBefore(other: HTMLElement, ref: Node) {
        this.element.insertBefore(other, ref);
	}
	
	insertAfter(other: HTMLElement, ref: Node) {
		if (ref.nextSibling)
			this.insertBefore(other, ref.nextSibling)
		else this.appendChild(other);
    }

    remove() {
        this.element.remove();
    }

    replaceWith(other: HTMLElement, parent: HTMLElement) {
        if (this.element.replaceWith)
            this.element.replaceWith(other);
        else if (parent)
            parent.replaceChild(other, this.element);
        else throw "Cannot replace element; no parent defined.";
    }

    find(selector: string): HTMLElement | null {
        return this.element.querySelector(selector);
    }

    appendChild(child: HTMLElement) {
        this.element.appendChild(child);
    }

    empty() {
        while (this.element.firstChild)
            this.element.removeChild(this.element.firstChild);
    }
}

export async function getAnimationFrame() {
	await new Promise((resolve, reject) => {
		window.requestAnimationFrame(() => 
			window.requestAnimationFrame(() => resolve()));
	});
}

/**
 * Creates a new HTML element.
 *
 * @param html              The HTML string to parse.
 * @returns {Node[]}        The root elements of the created HTML.
 */
export function createHtml(html: string) : Node[] {
    let template = document.createElement('template');
	template.innerHTML = html.trim ? html.trim() : html;

	let children = template.content.childNodes;
	let ret = []; // copy children into new array
	for (let i = 0; i < children.length; i++) {
		ret.push(children[i]);
	}

	if (ret.length > 0)
		return ret;
	else return [template];
}

/**
 * Creates a new text element.
 *
 * @param str       The string to create.
 * @returns {Text}  A created DOM node.
 */
export function createText(str: string): Text {
    return document.createTextNode(str);
}

/**
 * Provides an implementation of basic DOM functions for a
 * specified element.
 *
 * @param {HTMLElementImpl|HTMLElement|string} e        The element to provide an implementation for.
 * @returns {ElementImpl}
 */
export function element<T>(e: T) : ElementImpl<any> | null {
    if (e instanceof ElementImpl)
        return e;
    else if (typeof e === "string")
        return new StringElementImpl(`${e}`);
    else if (e instanceof HTMLElement)
		return new HTMLElementImpl(e);
	else if (e instanceof Node)
		return new HTMLNodeImpl(e);
	else if (e === null || typeof e === 'undefined')
		return null;
	else {
		console.log(e);
		throw `dom-wrapper: Cannot implement element "${Object.getPrototypeOf(e).constructor.name}" ${e}.`;
	}
}
