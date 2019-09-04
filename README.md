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
<script type="text/javascript" src="https://unpkg.com/declarativ@0.0.1/declarativ.min.js"></script>
```

#### NPM/Webpack

```sh
npm install declarativ
```

#### From Source

```sh
git clone https://github.com/fennifith/declarativ.git
cd declarativ/lib && make install
```

## Usage

Coming soon...

## Templates

Coming soon...
