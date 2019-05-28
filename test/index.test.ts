import { EventEmitter } from "events";
import { createRequester, createResponder } from "../src";

interface IJohnToAliceProtocol {
    "GREETING": {
        in: {greeting: string},
        out: {greeting: string},
    };
    "HOW_ARE_YOU": {
        in: {};
        out: {good: boolean};
    };
    "BYE": {
        in: {},
        out: {},
    };
}
interface IAliceToJohnProtocol {
    "HOW_ARE_YOU": {
        in: {};
        out: {good: boolean};
    };
}

describe("main test", () => {

    it("test request and reply", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const johnRequester = createRequester<IJohnToAliceProtocol>(john, alice);
        const johnResponder = createResponder<IAliceToJohnProtocol>(john, alice);

        const aliceRequester = createRequester<IAliceToJohnProtocol>(alice, john);
        const aliceResponder = createResponder<IJohnToAliceProtocol>(alice, john);

        const cancelGreeting = aliceResponder("GREETING", async ({greeting}) => {
            return {greeting: greeting + " to you too."};
        });
        johnResponder("HOW_ARE_YOU", async () => {
            return {good: true};
        });

        aliceResponder("HOW_ARE_YOU", async () => {
            return {good: false};
        });

        aliceResponder("BYE", async () => {
            return {};
        });

        expect((await johnRequester("GREETING", {greeting: "hey"})).greeting).toBe("hey to you too.");
        expect((await aliceRequester("HOW_ARE_YOU", {})).good).toBe(true);

        expect((await johnRequester("HOW_ARE_YOU", {})).good).toBe(false);
        expect((await johnRequester("BYE", {}))).toEqual({});

    });

    it("test cancel", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const johnRequester = createRequester<IJohnToAliceProtocol>(john, alice);
        const aliceResponder = createResponder<IJohnToAliceProtocol>(alice, john);

        const cancelGreeting = aliceResponder("GREETING", async ({greeting}) => {
            return {greeting: greeting + " to you too."};
        });

        expect((await johnRequester("GREETING", {greeting: "hey"})).greeting).toBe("hey to you too.");

        cancelGreeting.cancel();

        await expect(johnRequester("GREETING", {greeting: "hey"})).rejects.toThrow();
    });

    it("test error", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const johnRequester = createRequester<IJohnToAliceProtocol>(john, alice);
        const aliceResponder = createResponder<IJohnToAliceProtocol>(alice, john);

        aliceResponder("GREETING", async ({greeting}) => {
            throw new Error("not talking to you");
        });

        await expect(johnRequester("GREETING", {greeting: "hey"})).rejects.toThrow();

    });

    it("test two responders", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const aliceResponder = createResponder<IJohnToAliceProtocol>(alice, john);

        aliceResponder("GREETING", async ({greeting}) => {
            return {greeting: greeting + " to you too."};
        });

        expect(() => aliceResponder("GREETING", async ({greeting}) => {
            return {greeting: greeting + " to you too."};
        })).toThrow();
    });

    it("test timeout", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const johnRequester = createRequester<IJohnToAliceProtocol>(john, alice);

        await expect(johnRequester("GREETING", {greeting: "hey"})).rejects.toThrow();
    });
});
