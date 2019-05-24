import { EventEmitter } from "events";

export type RequestFunctionAsync<P extends {[key: string]: any}> = <K extends keyof P>(
    key: K, request: P[K]["in"],
) => Promise<P[K]["out"]>;

export type RequestFunction<P extends {[key: string]: any}> = <K extends keyof P>(
    key: K, request: P[K]["in"],
) => P[K]["out"];

export type AddResponderFunctionAsync<P extends {[key: string]: any}> = <K extends keyof P>(
    key: K, handler: (request: P[K]["in"]) => Promise<P[K]["out"]>) => {cancel: () => void};

export type AddResponderFunction<P extends {[key: string]: any}> = <K extends keyof P>(
    key: K, handler: (request: P[K]["in"]) => P[K]["out"]) => {cancel: () => void};

export interface IEventEmitterRequester<Protocol> extends EventEmitter {
    request: RequestFunctionAsync<Protocol>;
}

export interface IEventEmitterResponder<Protocol> extends EventEmitter {
    addResponder: AddResponderFunctionAsync<Protocol>;
}

export function createEventEmitterRequester<Protocol>(
    eventEmitter: EventEmitter,
    timeout: number = 2000,
    ): IEventEmitterRequester<Protocol> {

    const typedEventEmitter: IEventEmitterRequester<Protocol> = eventEmitter as any;

    typedEventEmitter.request = async (key: any, req: any) => {
        const messageID = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
        return await new Promise((resolve, reject) => {
            let done = false;
            const handler = (response: any) => {
                done = true;
                resolve(response);
            };
            const channel = key + "_response_" + messageID;
            eventEmitter.once(channel, handler);
            eventEmitter.emit(key, {messageID, req});
            setTimeout(() => {
                if (done) {
                    return;
                }
                eventEmitter.removeListener(channel, handler);
                reject(new Error("timeout"));
            }, timeout);
        });
    };

    return typedEventEmitter;
}

export function createEventEmitterResponder<Protocol>(
    eventEmitter: EventEmitter,
    ): IEventEmitterResponder<Protocol> {

    const typedEventEmitter: IEventEmitterResponder<Protocol> = eventEmitter as any;

    typedEventEmitter.addResponder = (key: any, handler: any) => {

        const listener = ({messageID, req}: any) => {
            handler(req).then((res: any) => {
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
