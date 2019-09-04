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

#### Script Tag

```html
<script type="text/javascript" src="https://unpkg.com/declarativ@0.0.3/dist/declarativ.js"></script>
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

Most component trees can be built using the standard functions defined in `declarativ.elements`. I often shorten this to `el` when using more than one or two of them, which makes it a bit easier to work with. Here's an example:

```js
const el = declarativ.elements;

let components = el.div(
  el.h1("This is a big header."),
  el.p(
    "Here, have a bit of text",
    el.a("and a link").attr("href", "https://example.com/"),
    "."
  )
);
```

After defining your component tree, it can be placed on the DOM by either calling the `render` or `renderElement` functions. Calling `render` simply returns the rendered jQuery element, but `renderElement` accepts a second "element" argument which the rendered content will be placed inside.

```js
declarativ.renderElement($("#content"), components).then(() => {
    console.log("Elements rendered!");
});
```

Working examples can be found in the [examples](../../tree/master/examples/) folder.

### Promises

Promises can be mixed in or bound to components to pass data to them, and the component will wait for them to resolve before rendering. Because inner components depend on their parent nodes to render, higher components will render first, and only the bound component and inner nodes will wait for the Promise.

```js
el.div(
  el.p("This will render first."),
  el.p(new Promise((resolve) => {
    setTimeout(() => resolve("This will render second."), 1000);
  })),
  el.p(
    new Promise((resolve) => {
      setTimeout(() => resolve("This will render last..."), 2000);
    }),
    " but not this!"
  )
)
```

### Handling Data

Nodes can exist in various forms inside of a component. In the last example, I specified a Promise and a string as the contents of a paragraph element. However, not all of the promises you use will return a string. Often times, you will handle data structures that need to be bound to multiple elements. This is where the `.bind()` function comes in useful.

```js
el.div(
  el.p("This will render first"),
  el.div(
    el.p((data) => data.first),
    el.p((data) => data.second)
  ).bind(Promise.resolve({
    first: "This is a string.",
    second: "This is another string."
  }))
)
```

Okay, a lot is happening here. I'll slow down and explain. The `bind` function allows you to specify a set of data to be passed to other parts of a component - and extends upon the types of nodes that can be placed inside it. Because the paragraph elements inside the div are not bound to any data, they inherit the Promise that is bound to their parent. The nodes inside of the paragraph elements are then specified as a function of the resolved data, returning the text to render.

### Templates

Coming soon...
