import { expect } from 'chai';
import { escapeHtml } from './html';
import { DataResolvable, PendingTasks } from './resolvable';

import * as el from '../elements';
import * as util from '../utilities';

describe("util/html.ts", () => {
    it("should escape HTML chars", () => {
		let htmlStr = "<script>console.log('hi!');</script>";
		expect(escapeHtml(htmlStr)).to.not.equal(htmlStr);
	});
});
