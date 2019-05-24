"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function createEventEmitterRequester(eventEmitter, timeout = 2000) {
    const typedEventEmitter = eventEmitter;
    typedEventEmitter.request = (key, req) => __awaiter(this, void 0, void 0, function* () {
        const messageID = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
        return yield new Promise((resolve, reject) => {
            let done = false;
            const handler = (response) => {
                done = true;
                resolve(response);
            };
            const channel = key + "_response_" + messageID;
            eventEmitter.once(channel, handler);
            eventEmitter.emit(key, { messageID, req });
            setTimeout(() => {
                if (done) {
                    return;
                }
                eventEmitter.removeListener(channel, handler);
                reject(new Error("timeout"));
            }, timeout);
        });
    });
    return typedEventEmitter;
}
exports.createEventEmitterRequester = createEventEmitterRequester;
function createEventEmitterResponder(eventEmitter) {
    const typedEventEmitter = eventEmitter;
    typedEventEmitter.addResponder = (key, handler) => {
        const listener = ({ messageID, req }) => {
            handler(req).then((res) => {
                eventEmitter.emit(key + "_response_" + messageID, res);
            });
        };
        eventEmitter.addListener(key, listener);
        return {
            cancel: () => eventEmitter.removeListener(key, listener),
        };
    };
    return typedEventEmitter;
}
exports.createEventEmitterResponder = createEventEmitterResponder;
//# sourceMappingURL=index.js.map