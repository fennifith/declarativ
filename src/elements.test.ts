import { expect } from 'chai';
import { escapeHtml } from './util/html';
import { DataResolvable, PendingTasks } from './util/resolvable';

import * as el from './elements';
import * as util from './utilities';

describe("elements.ts", () => {
	describe("Basic Rendering", () => {
		it("should render an empty tag", async function() {
			expect(await el.p().renderString()).to.be.equal("<p></p>");
		});

		it("should render text inside a tag", async function() {
			expect(await el.p("Hello!").renderString()).to.be.equal("<p>Hello!</p>");
		});

		it("should render elements inside a tag", async function() {
			expect(
				await el.p(
					el.span(),
					el.a()
				).renderString()
			).to.be.equal("<p><span></span><a></a></p>")
		});

		it("should render functions inside a tag", async function() {
			expect(
				await el.p(() => "Hello!").renderString()
			).to.be.equal("<p>Hello!</p>");
		});

		it("should render promises inside a tag", async function() {
			expect(
				await el.p(Promise.resolve("Hello!")).renderString()
			).to.be.equal("<p>Hello!</p>");
		});

		it("should render tag attributes", async function() {
			expect(
				await el.p().attr("id", "render").renderString()
			).to.be.equal('<p id="render"></p>')
		});
	});
	
	describe("Data States", () => {
		it("should fallback to error components", async function() {
			expect(
				await el.p(
					() => { throw "aaa"; }
				).whenError(
					el.span("Oh no.")
				).renderString()
			).to.be.equal("<span>Oh no.</span>");
		});
	});

	describe("Data Binding", () => {
		it("should bind data to child functions", async function() {
			expect(
				await el.p(
					(data: any) => data
				).bind("Hello!").renderString()
			).to.equal("<p>Hello!</p>");
		});

		it("should bind data to child elements", async function() {
			expect(
				await el.p(
					el.span(
						el.span(
							(data: any) => data
						)
					)
				).bind("Hello!").renderString()
			).to.equal("<p><span><span>Hello!</span></span></p>");
		});
	});
});
