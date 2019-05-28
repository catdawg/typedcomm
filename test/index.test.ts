import { EventEmitter } from "events";
import { createReceiver, createRequester, createResponder, createSender } from "../src";

interface IJohnToAliceOneWayProtocol {
    "HEY": {
        callMessage: string,
    };
    "BYE": {
        byeMessage: string,
    };
}

interface IJohnToAliceTwoWayProtocol {
    "GREETING": {
        in: {greeting: string},
        out: {greeting: string},
    };
    "HOW_ARE_YOU": {
        in: {};
        out: {good: boolean};
    };
}
interface IAliceToJohnTwoWayProtocol {
    "HOW_ARE_YOU": {
        in: {};
        out: {good: boolean};
    };
}

describe("main test", () => {

    it("test send and receive", async () => {
        const alice = new EventEmitter();

        const sendToAlice = createSender<IJohnToAliceOneWayProtocol>(alice);
        const aliceReceiver = createReceiver<IJohnToAliceOneWayProtocol>(alice);

        let receivedHeyMessage = null;
        let receivedByeMessage = null;

        const heyCancel = aliceReceiver("HEY", ({callMessage}) => {
            receivedHeyMessage = callMessage;
        });

        aliceReceiver("BYE", ({byeMessage}) => {
            receivedByeMessage = byeMessage;
        });
        expect(() => aliceReceiver("BYE", ({byeMessage}) => {
            receivedByeMessage = byeMessage;
        })).toThrow();

        sendToAlice("HEY", {
            callMessage: "Hey Alice!",
        });
        sendToAlice("BYE", {
            byeMessage: "Bye Alice!",
        });

        expect(receivedHeyMessage).toBe("Hey Alice!");
        expect(receivedByeMessage).toBe("Bye Alice!");

        heyCancel.cancel();
        receivedHeyMessage = null;
        sendToAlice("HEY", {
            callMessage: "Hello Again!",
        });

        expect(receivedHeyMessage).toBeNull();
    });

    it("test request and reply", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const johnRequester = createRequester<IJohnToAliceTwoWayProtocol>(john, alice);
        const johnResponder = createResponder<IAliceToJohnTwoWayProtocol>(john, alice);

        const aliceRequester = createRequester<IAliceToJohnTwoWayProtocol>(alice, john);
        const aliceResponder = createResponder<IJohnToAliceTwoWayProtocol>(alice, john);

        const cancelGreeting = aliceResponder("GREETING", async ({greeting}) => {
            return {greeting: greeting + " to you too."};
        });
        johnResponder("HOW_ARE_YOU", async () => {
            return {good: true};
        });

        aliceResponder("HOW_ARE_YOU", async () => {
            return {good: false};
        });

        expect((await johnRequester("GREETING", {greeting: "hey"})).greeting).toBe("hey to you too.");
        expect((await aliceRequester("HOW_ARE_YOU", {})).good).toBe(true);

        expect((await johnRequester("HOW_ARE_YOU", {})).good).toBe(false);
    });

    it("test cancel", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const johnRequester = createRequester<IJohnToAliceTwoWayProtocol>(john, alice);
        const aliceResponder = createResponder<IJohnToAliceTwoWayProtocol>(alice, john);

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

        const johnRequester = createRequester<IJohnToAliceTwoWayProtocol>(john, alice);
        const aliceResponder = createResponder<IJohnToAliceTwoWayProtocol>(alice, john);

        aliceResponder("GREETING", async ({greeting}) => {
            throw new Error("not talking to you");
        });

        await expect(johnRequester("GREETING", {greeting: "hey"})).rejects.toThrow();

    });

    it("test two responders", async () => {
        const john = new EventEmitter();
        const alice = new EventEmitter();

        const aliceResponder = createResponder<IJohnToAliceTwoWayProtocol>(alice, john);

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

        const johnRequester = createRequester<IJohnToAliceTwoWayProtocol>(john, alice);

        await expect(johnRequester("GREETING", {greeting: "hey"})).rejects.toThrow();
    });
});
