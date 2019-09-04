const $ = require('jquery');
const { renderElement: render, elements: el } = require('../../lib/index.js');
const templates = require('./templates.js');

console.log("Hi!");

let lorem = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve([
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fermentum posuere euismod. Aliquam ultricies, libero cursus sollicitudin egestas, diam tortor molestie tortor, a pellentesque tellus libero id lectus.",
            "Integer sed urna at felis pretium elementum. Integer sed turpis vehicula, consectetur turpis non, fringilla quam. Nullam elementum quis enim vel venenatis. Phasellus purus turpis, pellentesque congue fermentum sed, sollicitudin et magna.",
            "Nullam quis tellus quis enim dapibus cursus in ut tortor. Cras et nisl augue. Sed tellus ipsum, posuere quis feugiat eget, bibendum id eros. Fusce cursus, metus ac aliquam mollis, orci purus sodales erat, vitae cursus urna elit sed arcu.",
        ]);
    }, 2500);
});

render($('#render-target'), el.div(
    el.p("Hello!"),
    el.button("Click me!").on('click', () => alert("Hi there!")),
    el.hr(),
    el.article().bind(lorem).forEach(
        el.p((data) => data)
    ),
    templates.details("This is a bunch of fun templated content.").bind({ text: "Content content, templated content" }),
    templates.describedItem("This is another type of templated content.", "It works a little bit differently - as a function call, instead of a composed element. Most of the time, this method is easier to work with.")
));
