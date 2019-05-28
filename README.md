# TypedComm

TypedComm is a library for typescript projects that lets you define a protocol for communication using an typescript interface, through it's keys and values

# Installation

```
    npm install typedcomm --save
```

# API

This library provides two main functionalities, one is a function that is used to request (RequestFunction) and another is used to respond (AddResponderFunction).

## RequestFunction

```typescript
type RequestFunction<P extends {[key: string]: any}> = <K extends keyof P>(
    key: K, request: P[K]["in"],
) => P[K]["out"];
```

It has a type parameter that specifies the protocol. The protocol looks like this:

```typescript
interface ExampleProtocol {
    "A": {
        in: string,
        out: string,
    },
    "B": {
        in: number,
        out: {res: number}
    },
    // etc...
}
```

The function maps the "request" parameter type to the "in" in the object pointed by the "key" in the Protocol, and the return type to the "out" in the same object.

A promise version is also available "RequestFunctionAsync".

## AddResponderFunction

```typescript
type AddResponderFunction<P extends {[key: string]: any}> = <K extends keyof P>(
    key: K, handler: (request: P[K]["in"]) => P[K]["out"]) => {cancel: () => void};
```

It has a type parameter that specifies a protocol like RequestFunction.
The function maps the request parameter in the handler lambda to the "in" pointed by "key" in the protocol, and the return of the lambda is pointed by "out". Additionally, it returns an object that lets you cancel the responder.

Just like the RequestFunction, there's also a Promise version called AddResponderFunctionAsync.

## createRequester and createResponder

```typescript

interface IEventReceiver {
    addListener(event: string, listener: (response: any) => void): void;
    removeListener(event: string, listener: (response: any) => void): void;
}
interface IEventSender {
    emit(event: string, ...args: any[]): boolean;
}

function createRequester<Protocol>(
    eventReceiver: IEventReceiver,
    eventSender: IEventSender,
    timeout: number = 2000,
    ): RequestFunctionAsync<Protocol>;

function createResponder<Protocol>(
    eventReceiver: IEventReceiver,
    eventSender: IEventSender,
    ): AddResponderFunctionAsync<Protocol>
```

This method will implement a protocol using the input and output objects that resemble event emitters. See the tests for understanding better how this works.

# Full Example

Example of a client / server communication typed with a protocol defined in a shared.ts file.

shared.ts
```typescript

import { AddResponderFunction, RequestFunction } from "typedcomm";

interface IProtocol {
    "START": {
        in: {},
        out: {pieces: [string]},
    };
    "PLAY": {
        in: {piece: string, to: number},
        out: {success: boolean},
    };
    "END": {
        in: {},
        out: {},
    };

    // any new message is added here
}

interface IServerToClientCommunicator {
    addResponder: AddResponderFunction<IProtocol>;
}

interface IClientToServerCommunicator {
    request: RequestFunction<IProtocol>;
}

```

client.ts
```typescript
import {IClientToServerCommunicator} from "shared";

const server: IClientToServerCommunicator = /* insert here code that sets up a communicator, e.g. connect to a server */;

// if "START" is first argument, second is typed to {} and return is {pieces: [string]}
const pieces = server.request("START", {}).pieces;

// if "PLAY" is first argument, second is typed to {piece: string, to: number} and return is {success: boolean}
if (server.request("PLAY", {piece: pieces[0]}).success) {
    console.log("YEY");
} else {
    console.log(":(");
}

server.request("END", {});

```

server.ts
```typescript
import {IServerToClientCommunicator} from "shared";

const client: IServerToClientCommunicator = /* insert here code that waits for a connection to be established */;

// if "START" is first argument, param in lambda is typed to {} and the lambda has to return {pieces: string[]}
client.addResponder("START", ({}) => {
    const pieces = ["A", "B", "C"];

    const cancelResponders: Array<{cancel: () => void}> = [];

    // if "START" is first argument,
    // param in lambda is typed to {piece: string} and the lambda has to return {success: boolean}
    const cancelPlay = client.addResponder("PLAY", ({piece}) => {
        return {success: pieces.indexOf(piece) !== -1};
    });

    // if "END" is first argument,
    // param in lambda is typed to {} and the lambda has to return {}
    const cancelEnd = client.addResponder("END", () => {
        for (const canceller of cancelResponders) {
            canceller.cancel();
        }

        return {};
    });

    cancelResponders.push(cancelPlay);
    cancelResponders.push(cancelEnd);

    return {pieces};
});

```
