import { EventEmitter } from "events";
import { createEventEmitterRequester, createEventEmitterResponder } from "../src";

interface IConversationProtocol {
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

describe("main test", () => {

    it("test request and reply", async () => {
        const john = new EventEmitter();

        const johnRequester = createEventEmitterRequester<IConversationProtocol>(john);

        const johnResponder = createEventEmitterResponder<IConversationProtocol>(john);

        const cancelGreeting = johnResponder.addResponder("GREETING", async ({greeting}) => {
            return {greeting: greeting + " to you too."};
        });

        johnResponder.addResponder("HOW_ARE_YOU", async () => {
            return {good: true};
        });

        johnResponder.addResponder("BYE", async () => {
            return {};
        });

        expect((await johnRequester.request("GREETING", {greeting: "hey"})).greeting).toBe("hey to you too.");
        expect((await johnRequester.request("HOW_ARE_YOU", {})).good).toBe(true);
        expect((await johnRequester.request("BYE", {}))).toEqual({});

        cancelGreeting.cancel();

        await expect(johnRequester.request("GREETING", {greeting: "hey"})).rejects.toThrow();
    });
});
