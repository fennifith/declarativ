import { node, Component, ResolvableNode } from './component';

export function html(str: string) : Component {
	return new Component(() => str);
}

export function forEach(...components: ResolvableNode[]) : Component {
	let n = node(components);
	return node(function(data: any) {
		return Object.keys(data).map((key) => n.bind(data[key]));
	});
}
