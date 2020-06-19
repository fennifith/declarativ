import { expect } from 'chai';
import { DataResolvable, PendingTasks } from './resolvable';

describe("util/resolvable.ts", () => {
    describe("DataResolvable", () => {
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
            let data = new DataResolvable((d: any) => d);
            expect(await data.resolve(250)).to.equal(250);
        });
    });

    describe("PendingTasks", () => {
        let functions = [
            (): any => null,
            (): any => null,
            (): any => null,
            (): any => null,
            (): any => null,
        ];

		let tasks = new PendingTasks([]);
		functions.forEach((task) => tasks.push(task));

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
});
