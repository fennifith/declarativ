const { compose, wrapCompose: wrap, elements: el } = require('../../lib/index.js');

// first template example
module.exports.details = compose((inner, data) => `
<details>
    <summary>${data.text || 'This is a summary.'}</summary>
    ${inner}
</details>
`);

// second template example (just use a function)
module.exports.describedItem = function(title, content) {
    return el.div(
        el.h3(title),
        el.p(content)
    )
};
