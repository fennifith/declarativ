const expect = require('chai').expect;

describe("HTML Utilities (util/html.js)", () => {
    const { escapeHtml } = require('./src/util/html.js');

    it("should escape HTML chars", () => {
        let htmlStr = "<script>console.log('hi!');</script>";
        expect(escapeHtml(htmlStr)).to.not.equal(htmlStr);
    });
});

describe("DataResolvable class (util/resolvable.js)", () => {
    const { DataResolvable } = require('./src/util/resolvable.js');

    it("should resolve promises", async function() {
        let data = new DataResolvable(Promise.resolve(3));
        expect(await data.resolve()).to.equal(3);
    });

    it("should resolve functions", async function() {
        let data = new DataResolvable(() => 15);
        expect(await data.resolve()).to.equal(15);
    });

    it("should resolve raw values", async function() {
        let data = new DataResolvable("hello!");
        expect(await data.resolve()).to.equal("hello!");
    });

    it("should pass resolved arguments through to functions", async function() {
        let data = new DataResolvable((d) => d);
        expect(await data.resolve(250)).to.equal(250);
    });
});

describe("PendingTasks class (util/resolvable.js)", () => {
    const { PendingTasks } = require('./src/util/resolvable.js');

    let functions = [
        () => null,
        () => null,
        () => null,
        () => null,
        () => null,
    ];

    let tasks = new PendingTasks();
    for (let i in functions)
        tasks.push(i);

    it("should have the correct length attribute", () => {
        expect(tasks.length).to.equal(functions.length);
    });

    it("can be constructed from an array", () => {
        let newTasks = new PendingTasks(functions);
        expect(newTasks).to.have.property('length');
        expect(newTasks.length).to.be.equal(functions.length);
    });

    it("resolves all tasks when called", async function() {
        let i = 0;
        let pending = new PendingTasks([() => i = 1]);
        await pending.call();

        expect(i).to.equal(1);
    });

    it("passes arguments to called functions", async function() {
        let val = 0;
        let pending = new PendingTasks([(arg) => val = arg]);
        await pending.call(20);

        expect(val).to.equal(20);
    });
});

describe("Element Tests (elements.js)", () => {
    const el = require('./src/elements.js');

    it("should render an empty tag", async function() {
        expect(await el.p().renderString()).to.be.equal("<p></p>");
    });

    it("should render text inside a tag", async function() {
        expect(await el.p("Hello!").renderString()).to.be.equal("<p>Hello!</p>");
    });

    it("should render elements inside a tag", async function() {
        expect(await el.p(
            el.span(),
            el.a()
        ).renderString()).to.be.equal("<p><span></span><a></a></p>")
    });
});
