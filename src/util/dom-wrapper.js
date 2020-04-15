/**
 * Wraps jQuery / DOM functions to abstract them
 * from the rest of the library.
 *
 * @module dom/dom-wrapper
 */

/**
 * Base element implementation class.
 *
 * @class ElementImpl
 */
class ElementImpl {
    constructor(element) {
        this.element = element;
    }

    attr(name, value) {
        if (value)
            this.setAttr(name, value);
        else return this.getAttr(name);
    }

    getAttr(name) {
        throw "No getAttr implementation";
    }

    setAttr(name, value) {
        throw "No setAttr implementation";
    }

    get className() {
        return this.getClassName();
    }

    set className(value) {
        this.setClassName(value);
    }

    getClassName() {
        return this.getAttr("class");
    }

    setClassName(value) {
        this.setAttr("class", value);
    }

    on(event, fun) {
        throw "No onEvent implementation";
    }

    /**
     * Inserts one element before another inside
     * of the element that it is called upon.
     *
     * @param {HTMLElement|jQuery} other    The element to insert
     * @param {HTMLElement|jQuery} ref      The reference/index element to insert
     *                                      `other` before.
     */
    insertBefore(other, ref) {
        throw "No insertBefore implementation";
	}
	
	/**
     * Inserts one element after another inside
     * of the element that it is called upon.
     *
     * @param {HTMLElement|jQuery} other    The element to insert
     * @param {HTMLElement|jQuery} ref      The reference/index element to insert
     *                                      `other` after.
     */
    insertAfter(other, ref) {
        throw "No insertAfter implementation";
    }

    /**
     * Remove the element from the DOM.
     */
    remove() {
        throw "No remove implementation";
    }

    /**
     * Replace the element with another.
     *
     * @param {HTMLElement|jQuery} other        The element to replace it with.
     * @param {HTMLElement|jQuery?} parent      The parent element to replace inside.
     */
    replaceWith(other, parent) {
        throw "No replaceWith implementation"
    }

    /**
     * Find a specific element inside of another.
     *
     * @param {string} selector                 The selector string to query.
     */
    find(selector) {
        throw "No find implementation"
    }

    /**
     * Append a child node to the current
     *
     * @param {HTMLElement|jQuery} child        The node to append.
     */
    appendChild(child) {
        throw "No appendChild implementation"
    }

    /**
     * Clear all child nodes from the element.
     */
    empty() {
        throw "No clear implementation"
    }

    get() {
        return this.element;
    }
}

/**
 * The most hacky and basic possible implementation
 * for string HTML parsing / manipulation.
 *
 * @class StringElementImpl
 */
class StringElementImpl extends ElementImpl {
    constructor(element) {
        super(element);
        this.attrs = {};
    }

    setAttr(name, value) {
        this.attrs[name] = value;
    }

    getAttr(name) {
        return this.attrs[name];
    }

    get() {
        let index = this.element.indexOf(">");
        return this.element.slice(0, index)
            + Object.keys(this.attrs).map((key) => ` ${key}="${this.attrs[key]}"`)
            + this.element.slice(index);
    }
}

/**
 * Implementation for plain HTML elements.
 *
 * @class HTMLElementImpl
 */
class HTMLElementImpl extends ElementImpl {
    constructor(element) {
        super(element);
    }

    setAttr(name, value) {
        this.element.setAttribute(name, value);
    }

    getAttr(name) {
        return this.element.getAttribute(name);
    }

    on(event, fun) {
        this.element.addEventListener(event, fun);
    }

    insertBefore(other, ref) {
        this.element.insertBefore(other, ref);
	}
	
	insertAfter(other, ref) {
		if (ref.nextSibling)
			this.insertBefore(other, ref.nextSibling)
		else this.appendChild(other);
    }

    remove() {
        this.element.remove();
    }

    replaceWith(other, parent) {
        if (this.element.replaceWith)
            this.element.replaceWith(other);
        else if (parent)
            parent.replaceChild(other, this.element);
        else throw "Cannot replace element; no parent defined.";
    }

    find(selector) {
        return this.element.querySelector(selector);
    }

    appendChild(child) {
        this.element.appendChild(child);
    }

    empty() {
        while (this.element.firstChild)
            this.element.removeChild(this.element.firstChild);
    }
}

/**
 * Implementation for jQuery elements.
 *
 * @class JQueryElementImpl
 */
class JQueryElementImpl extends ElementImpl {
    constructor(element) {
        super(element);
    }

    setAttr(name, value) {
        this.element.attr(name, value);
    }

    getAttr(name) {
        return this.element.attr(name);
    }

    on(event, fun) {
        this.element.on(event, fun);
    }

    insertBefore(other, ref) {
        const $ = require('jquery');
        $(other).insertBefore($(ref));
	}
	
	insertAfter(other, ref) {
        const $ = require('jquery');
        $(other).insertAfter($(ref));
    }

    remove() {
        this.element.remove();
    }

    replaceWith(other) {
        this.element.replaceWith($(other));
    }

    find(selector) {
        return this.element.find(selector);
    }

    appendChild(child) {
        const $ = require('jquery');
        this.element.append($(child));
    }

    empty() {
        this.element.empty();
    }
}

async function getAnimationFrame() {
	await new Promise((resolve, reject) => {
		window.requestAnimationFrame(() => 
			window.requestAnimationFrame(() => resolve()));
	});
}

/**
 * Creates a new HTML element.
 *
 * @param html              The HTML string to parse.
 * @returns {HTMLElement}     The root element of the created HTML.
 */
function createHtml(html) {
    let template = document.createElement('template');
	template.innerHTML = html.trim();

	let children = template.content.children;
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
function createText(str) {
    return document.createTextNode(str);
}

/**
 * Provides an implementation of basic DOM functions for a
 * specified element.
 *
 * @param {HTMLElementImpl|HTMLElement|jQuery|string} e        The element to provide an implementation for.
 * @returns {ElementImpl}
 */
function element(e) {
    if (e instanceof ElementImpl)
        return e;
    else if (typeof e === "string")
        return new StringElementImpl(e);
    else if (window && e instanceof window.Node)
        return new HTMLElementImpl(e);
    else if (window && e instanceof window.jQuery)
        return new JQueryElementImpl(e);
	else if (e === null || typeof e === 'undefined')
		return null;
	else throw "Cannot implement element " + e;
}

module.exports = { getAnimationFrame, createHtml, createText, element };
