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
    clear() {
        throw "No clear implementation"
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

    insertBefore(other, ref) {
        this.element.insertBefore(other, ref);
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

    clear() {
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

    insertBefore(other, ref) {
        const $ = require('jquery');
        $(other).insertBefore($(ref));
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

    clear() {
        this.element.clear();
    }
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
    return template.content.firstChild;
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
 * @param {HTMLElementImpl|HTMLElement|jQuery} e        The element to provide an implementation for.
 * @returns {ElementImpl}
 */
function element(e) {
    if (e instanceof ElementImpl)
        return e;
    else if (e instanceof HTMLElement)
        return new HTMLElementImpl(e);
    else if (e instanceof jQuery)
        return new JQueryElementImpl(e);
    else throw "Cannot implement element " + e;
}

module.exports = { createHtml, createText, element };
