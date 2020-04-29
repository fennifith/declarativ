Declarativ
[![Build Status](https://github.com/fennifith/declarativ/workflows/NodeJS%20Package/badge.svg)](https://github.com/fennifith/declarativ/actions)
[![NPM Package](https://img.shields.io/npm/v/declarativ?color=red&logo=npm)](https://www.npmjs.com/package/declarativ)
[![Discord](https://img.shields.io/discord/514625116706177035.svg?logo=discord&colorB=7289da)](https://discord.jfenn.me/)
[![Liberapay](https://img.shields.io/badge/liberapay-donate-yellow.svg?logo=liberapay)](https://jfenn.me/links/liberapay)
=======

"Declarativ" is a lightweight and asynchronous HTML templating library for JavaScript. It definitely isn't my own reinvention of React's [JSX](https://reactjs.org/docs/introducing-jsx.html). Okay, it kind of is, but whatever, it's still cool.

Declarativ allows you to write a document tree using a series of nested function calls, much like how Declarative UI works inside [Flutter](https://flutter.dev/docs/get-started/flutter-for/declarative#how-to-change-ui-in-a-declarative-framework) or in [Jetpack Compose](https://developer.android.com/jetpack/compose). Here's an example:

```js
container(
  jumbotron(
    h1("This is a big header."),
    button("Do something").on("click", () => alert("Hello!")),
    p($.get("https://loripsum.net/api/plaintext"))
  )
)
```

## Installation

**Note:** although this library can and does use it, it _does not_ depend on jQuery. It will behave the same regardless of whether it is passed an unwrapped HTMLElement or a jQuery class. This is because of _perplexed kittens_ and [_fairy dust_](./src/util/dom-wrapper.js).

#### Script Tag

```html
<script type="text/javascript" src="https://unpkg.com/declarativ@0.1.5/dist/declarativ.js"></script>
```

(the module will be included in the global scope as the `declarativ` variable)

#### NPM/Webpack

```sh
npm install declarativ
```

#### From Source

```sh
git clone https://github.com/fennifith/declarativ.git
cd declarativ && make install
```

## Usage

Most component trees can be built using the standard functions defined in `declarativ.elements`. I often use [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to move them to the current scope when using more than one or two of them, which makes it a bit easier to work with. Here's an example:

```js
const { div, h1, p, a } = declarativ.elements;

let components = div(
  h1("This is a big header."),
  p(
    "Here, have a bit of text",
    a("and a link").attr("href", "https://example.com/"),
    "."
  )
);
```

After defining your component tree, it can be placed on the DOM by either calling the `render` or `renderString` functions. Calling `render` will place them inside whatever element you pass as its argument, while `renderString` simply returns their HTML representation.

```js
components.render($("#content")).then(() => {
    console.log("Elements rendered!");
});
```

Working examples can be found in the [examples](../../tree/master/docs/examples/) folder.

### Promises & Asynchronicity

Promises can be mixed in with components, and declarativ will wait for them to resolve before processing the result.

```js
p(
  "Everything in this example ",
  new Promise((resolve) => {
    setTimeout(() => resolve("will all render "), 1000);
  }),
  new Promise((resolve) => {
    setTimeout(() => resolve("at the exact same "), 2000);
  }),
  "time!"
)
```

This happens a bit differently when using the `.bind` method; components that are unbound will render first, and any children within a bound component will wait for its promise to resolve before being processed.

```js
div(
  p("This will render first."),
  p("This will render second.").bind(new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  })),
  p("This will render last.").bind(new Promise((resolve) => {
    setTimeout(() => resolve("at the exact same"), 2000);
  }))
)
```

### Handling Data

Nodes can exist in various forms inside of a component. In the last example, I specified a Promise and a string as the contents of a paragraph element. However, not all of the promises you use will return a string. Often times, you will handle data structures that need to be bound to multiple elements. This is where the `.bind()` function comes in useful.

```js
div(
  p("This will render first"),
  div(
    p((data) => data.first),
    p((data) => data.second)
  ).bind(Promise.resolve({
    first: "This is a string.",
    second: "This is another string."
  }))
)
```

Okay, a lot is happening here. I'll slow down and explain.

The `bind` function _also_ allows you to specify a set of data to be passed to other parts of a component - and extends upon the types of nodes that can be placed inside it. Because the paragraph elements inside the div are not bound to any data, they inherit the Promise that is bound to their parent. The nodes inside of the paragraph elements are then specified as a function of the resolved data, returning the text to render.

A more complex data binding situation based off the GitHub API can be found in [examples/binding.html](./docs/examples/binding.html).

### Templates

Templating functionality is crucial for projects that involve a large number of elements or repeat a common set of element structures in multiple places. There are a few different ways to create them:

#### Functions

The easiest is to just create a function that returns another component, like so:

```js
function myComponent(title, description) {
  return div(
    h3(title),
    p(description)
  );
}
```

Because you're just passing the arguments directly into the structure, this allows you to pass your function a string, another component, a function(data), or a Promise, and have it resolve during the render.

#### Wrapped Components

If you want to make a component that just slightly extends upon an existing instance of one, it can be wrapped in a function that will act like other components during use. This isn't useful very often, as any child components will be lost in the process, but it is useful if you just want to add a class name or attribute to a component without defining a structure.

```js
const myComponent = declarativ.wrapCompose(
  div().className("fancypants")
);
``` 

#### Custom Elements

This is possibly the least useful kind of template, but I'll leave it here anyway. Most elements are specified inside `declarativ.elements`, but in the event that you want to use one that isn't, you can create an element template by calling `declarativ.compose()` with a template function.

By "template function", it must be a function that accepts a string and returns that string inside of the element's HTML tag. For example, here I implement the deprecated `<center>` tag.

```js
const myComponent = declarativ.compose((inner) => `<center>${inner}</center>`);
```

Working examples of all of these templates can be found in [examples/templates.html](./docs/examples/templates.html). 
