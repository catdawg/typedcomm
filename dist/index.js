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
function createSender(eventSender) {
    return (key, message) => __awaiter(this, void 0, void 0, function* () {
        eventSender.emit("TYPED_COMM_SEND", {
            key,
            message,
        });
    });
}
exports.createSender = createSender;
function createReceiver(eventReceiver) {
    const handlers = {};
    eventReceiver.addListener("TYPED_COMM_SEND", ({ key, message }) => {
        if (handlers[key] == null) {
            return;
        }
        else {
            handlers[key](message);
        }
    });
    return (key, handler) => {
        if (handlers[key] == null) {
            handlers[key] = handler;
        }
        else {
            throw new Error("only one responder allowed for " + key);
        }
        return {
            cancel: () => {
                handlers[key] = null;
            },
        };
    };
}
exports.createReceiver = createReceiver;
function createRequester(eventReceiver, eventSender, timeout = 2000) {
    return (key, request) => __awaiter(this, void 0, void 0, function* () {
        const id = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
        return yield new Promise((resolve, reject) => {
            let done = false;
            const responseChannel = "TYPED_COMM_RESPONSE_" + id;
            const responseHandler = ({ failure, response }) => {
                done = true;
                eventReceiver.removeListener(responseChannel, responseHandler);
                if (failure != null) {
                    reject(new Error(failure));
                }
                else {
                    resolve(response);
                }
            };
            eventReceiver.addListener(responseChannel, responseHandler);
            setTimeout(() => {
                if (done) {
                    return;
                }
                eventReceiver.removeListener(responseChannel, responseHandler);
                reject(new Error("timeout"));
            }, timeout);
            eventSender.emit("TYPED_COMM_REQUEST", {
                key, id, request,
            });
        });
    });
}
exports.createRequester = createRequester;
function createResponder(eventReceiver, eventSender) {
    const handlers = {};
    eventReceiver.addListener("TYPED_COMM_REQUEST", ({ key, id, request }) => {
        const responseChannel = "TYPED_COMM_RESPONSE_" + id;
        if (handlers[key] == null) {
            eventSender.emit(responseChannel, {
                failure: "no responder for " + key,
            });
        }
        else {
            handlers[key](request).then((response) => {
                eventSender.emit(responseChannel, {
                    response,
                });
            }, (reason) => {
                eventSender.emit(responseChannel, {
                    failure: reason,
                });
            });
        }
    });
    return (key, handler) => {
        if (handlers[key] == null) {
            handlers[key] = handler;
        }
        else {
            throw new Error("only one responder allowed for " + key);
        }
        return {
            cancel: () => {
                handlers[key] = null;
            },
        };
    };
}
exports.createResponder = createResponder;
//# sourceMappingURL=index.js.map