import { EventEmitter } from "events";

import {
    getEventEmitterAnswerer,
    getEventEmitterAsker,
    getEventEmitterHearer,
    getEventEmitterTeller} from "../src";

interface IEmptyMessage {
}

interface IIDMessage {
    name: string;
    age: number;
}

interface IGetStateMessage {
    prop: string;
}

interface IStateMessage {
    value: number;
}

interface IMessageMap {
    "NONE": IEmptyMessage;
    "GREETING": IIDMessage;
    "GET_STATE": IGetStateMessage;
    "STATE": IStateMessage;
}

interface IQuestionMap {
    "GET_STATE": "STATE";
}

describe("main test", () => {

    it("test tell and hear", () => {
        const john = new EventEmitter();

        const johnTeller = getEventEmitterTeller<IMessageMap>(john);
        const johnHearer = getEventEmitterHearer<IMessageMap>(john);

        let johnReceivedGreeting: IIDMessage = null;
        const cancelGreetingJohnHearer = johnHearer("GREETING", (message) => {
            johnReceivedGreeting = message;
        });

        johnTeller("GREETING", {name: "unittestman", age: 30});

        expect(johnReceivedGreeting.name).toBe("unittestman");
        expect(johnReceivedGreeting.age).toBe(30);
        johnReceivedGreeting = null;
        cancelGreetingJohnHearer.cancel();

        johnTeller("GREETING", {name: "unittestman2", age: 30});

        expect(johnReceivedGreeting).toBeNull();
    });

    it("test ask and answer", async () => {
        const john = new EventEmitter();

        const johnAsker = getEventEmitterAsker<IMessageMap, IQuestionMap>(john);
        const johnAnswerer = getEventEmitterAnswerer<IMessageMap, IQuestionMap>(john);

        const greetingAnswerer = johnAnswerer("GET_STATE", async (message) => {

            return {
                value: 10,
            };
        });

        const reply = await johnAsker("GET_STATE", {prop: "something"});
        expect(reply.value).toBe(10);

        greetingAnswerer.cancel();
    });
});
