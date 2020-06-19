import { node, Component, ResolvableNode } from './component';
import { ResolvableValue, resolve } from "./util/resolvable";

export function html(str: string) : Component {
	return new Component(() => str);
}

export function forEach(items: ResolvableValue<any[]>, ...components: ResolvableNode[]) : Component {
	return node(resolve(items).then(array => array.map((item) => node(components)?.bind(item))))!!;
}
