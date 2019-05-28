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

interface IEventReceiver {
    addListener(event: string, listener: (response: any) => void): void;
    removeListener(event: string, listener: (response: any) => void): void;
}
interface IEventSender {
    emit(event: string, ...args: any[]): boolean;
}

export function createRequester<Protocol>(
    eventReceiver: IEventReceiver,
    eventSender: IEventSender,
    timeout: number = 2000,
    ): RequestFunctionAsync<Protocol> {

    return async (key, request) => {

        const id = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
        return await new Promise((resolve, reject) => {

            let done = false;
            const responseChannel = "TYPED_COMM_RESPONSE_" + id;
            const responseHandler = ({failure, response}: {failure: any, response: any}) => {
                done = true;
                eventReceiver.removeListener(responseChannel, responseHandler);
                if (failure != null) {
                    reject(new Error(failure));
                } else {
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
    };
}

export function createResponder<Protocol>(
    eventReceiver: IEventReceiver,
    eventSender: IEventSender,
    ): AddResponderFunctionAsync<Protocol> {

    const handlers: Record<string, (req: any) => Promise<any>> = {};

    eventReceiver.addListener("TYPED_COMM_REQUEST", ({key, id, request}) => {
        const responseChannel = "TYPED_COMM_RESPONSE_" + id;
        if (handlers[key] == null) {
            eventSender.emit(responseChannel, {
                failure: "no responder for " + key,
            });
        } else {
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

    return (key: any, handler: any) => {
        if (handlers[key] == null) {
            handlers[key] = handler;
        } else {
            throw new Error("only one responder allowed for " + key);
        }

        return {
            cancel: () => {
                handlers[key] = null;
            },
        };
    };
}
