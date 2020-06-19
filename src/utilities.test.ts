import { expect } from 'chai';

import * as el from './elements';
import * as util from './utilities';

describe("utilities.ts", () => {
	it("iterates over arrays with forEach()", async function() {
		expect(
			await el.p(
				util.forEach(
					Promise.resolve(["a", "b", "c"]),
					el.span((str: any) => str)
				)
			).renderString()
		).to.be.equal("<p><span>a</span><span>b</span><span>c</span></p>");
	});
});
