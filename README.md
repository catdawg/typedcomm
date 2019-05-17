# TypedComm

TypedComm is a library for typescript projects that lets you define a protocol for one way communication, called hearing and telling (or listening and emitting) and two way communication, called asking and answering. The protocol messages are specified in an object interface definition, through its keys and values.

# Installation

```
    npm install typedcomm --save
```

# Usage

## Tell (emit) example
``TellFunction<MessageMap>`` is a type definition for a method like ``<N>(name: N, message: MessageMap[N]): void``. This lets you make sure that the string in ``name`` always corresponds to the right ``message`` structure passed.

Example:
```typescript 
import {TellFunction} from "typedcomm";

interface IIDMessage {
    name: string;
    age: number;
}

interface IMessageMap {
    "GREETING": IIDMessage;
    "MESSAGE1": {};
    "MESSAGE2": {something: string}
}

const teller: TellFunction<IMessageMap> = (messageName, message) => {
    // insert message passing code here
    // e.g. send the message through a socket
};


teller(
    "GREETING", /* GREETING | MESSAGE1 | MESSAGE" */
    {age: 40, name: "Jon"}, /* IMessageMap["GREETING"] */
);

// compile error, must have IIDMessage format
teller("GREETING", {});

// compile error, "OTHER_MESSAGE" not defined in IMessageMap
teller("OTHER_MESSAGE", {});
```

## Hear (listen) example

``AddHearFunction<MessageMap>`` is a type definition for a method like ``<N>(name: N, handler: (message: MessageMap[N])): {cancel: () => void}``. This lets you make sure that the type of ``message`` corresponds to the correct type.

Example:
```typescript
import {AddHearFunction} from "typedcomm";

interface IIDMessage {
    name: string;
    age: number;
}

interface IMessageMap {
    "GREETING": IIDMessage;
    "MESSAGE1": {};
    "MESSAGE2": {something: string};
}

const hearer: AddHearFunction<IMessageMap> = (messageName, handler)  => {
    // insert message listen registration code here.
    // for example, add a listener to an emitter
    return {
        cancel: () => {
            // cancel the listen
        },
    };
};

const cancelListen1 = hearer("GREETING", ({name, age}) => {
    // insert message handling code here
});
cancelListen1.cancel();

// error, other is not defined in IIDMessage
hearer("GREETING", ({other}) => {});

// error, "OTHER_MESSAGE" is not defined in IMessageMap
hearer("OTHER_MESSAGE", ({}) => {});
```

## Ask example

``AskFunction<MessageMap, QuestionMap>`` is a type definition for a method like ``<Q>(name: Q, message: MessageMap[Q]): MessageMap[QuestionMap[Q]]``. If you have an API that you send a payload with a specific structure, and you always expect the same payload structure back, you can use this to function type for that API.

Example:
```typescript
import {AskFunction} from "typedcomm";

interface IGetStateMessage {
    prop: string;
}

interface IStateMessage {
    value: number;
}

interface IMessageMap {
    "GET_STATE": IGetStateMessage;
    "STATE": IStateMessage;
    "MESSAGE1": {};
    "MESSAGE2": {something: string}
}

interface IQuestionMap {
    "GET_STATE": "STATE";
    "MESSAGE1": "MESSAGE2";
}

const asker: AskFunction<IMessageMap, IQuestionMap> = (questionName, question) => {
    // implement code that asks the question
    // e.g. send through a socket and wait for the response.

    return answer;
};

const {value} = asker("GET_STATE", {prop: "prop1"});

// compile error, "something" not defined in IStateMessage
const {something} = asker("GET_STATE", {prop: "prop1"});

// compile error, "something" not defined in IGetStateMessage
const {value} = asker("GET_STATE", {something: "else"});
```


## Answerer example

``AddAnswerFunction<MessageMap, QuestionMap>`` is a type definition for a method like ``<Q>(name: Q, handler: (message: MessageMap[Q]) => {cancel: () => void}``. If you have an API that lets you register for "answering" a specific payload request with another specific payload response, you can use this to type that API.

```typescript
import {AddAnswerFunction} from "typedcomm";

interface IGetStateMessage {
    prop: string;
}

interface IStateMessage {
    value: number;
}

interface IMessageMap {
    "GET_STATE": IGetStateMessage;
    "STATE": IStateMessage;
    "MESSAGE1": {};
    "MESSAGE2": {something: string}
    
    // insert as many other pairs as you need
}

interface IQuestionMap {
    "GET_STATE": "STATE";
    "MESSAGE1": "MESSAGE2";
}

const answerer: AddAnswerFunction<IMessageMap, IQuestionMap> = (questionName, handler) => {
    // register handler for the specified question
    // e.g. add as listener in an event emitter

    return {
        cancel: () => {
            // cancel the listen
        },
    };
};

const cancelAnswer = answerer("GET_STATE", ({prop}) => {
    return {
        value: 10,
    };
});

// compile error, something not in IGetStateMessage
answerer("GET_STATE", async ({something}) => {
    return {
        value: 10,
    };
});

// compile error, return type is wrong, "something" not in IStateMessage
answerer("GET_STATE", async ({prop}) => {
    return {
        something: 10,
    };
});

```

