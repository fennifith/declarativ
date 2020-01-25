const { DataResolvable } = require('./util/resolvable.js');
const { node } = require('./component.js');

function forEach(...components) {
	let n = node(components);
	return function(data) {
		return node(Object.values(data).map((i) => n.bind(i)));
	}
}

function when(condition, ...components) {
	if (typeof condition === "function")
		return node((data) => when(condition(data), components));
	else if (condition instanceof Promise)
		return node(condition.then((c) => when(c, components)));

	return node(condition ? components : null);
}

function whenEqual(value, ...components) {
	return when((data) => data == value, components);
}

module.exports = {
	forEach,
	when,
	whenEqual
};

