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
<script type="text/javascript" src="https://unpkg.com/declarativ@0.0.1/dist/declarativ.js"></script>
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

### Templates

Coming soon...
