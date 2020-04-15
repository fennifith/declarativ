const { node, Component } = require('./component.js');

function html(str) {
	return new Component(() => str);
}

function forEach(...components) {
	let n = node(components);
	return node(function(data) {
		return Object.values(data).map((i) => n.bind(i));
	});
}

module.exports = {
	html,
	forEach
};

