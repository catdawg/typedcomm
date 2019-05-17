import { EventEmitter } from "events";

// tslint:disable-next-line:interface-over-type-literal
type MessageMap = Record<string, any>;
type QuestionMap<MMap extends MessageMap> = Partial<Record<keyof MMap, keyof MMap>>;

type QuestionName
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>>
 = keyof QMap & keyof MMap;

type AnswerName
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>, Q extends QuestionName<MMap, QMap>>
 = QMap[Q];

export type AskAsyncFunction
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>>
 = <Q extends QuestionName<MMap, QMap>>
    (questionName: Q, question: MMap[Q]) => Promise<MMap[AnswerName<MMap, QMap, Q>]>;

export type AskFunction
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>>
 = <Q extends QuestionName<MMap, QMap>>
    (questionName: Q, question: MMap[Q]) => MMap[AnswerName<MMap, QMap, Q>];

export type TellFunction
    <MMap extends MessageMap>
 = <M extends keyof MMap>
    (messageName: M, message: MMap[M]) => void;

export type AddHearFunction
    <MMap extends MessageMap>
 = <M extends keyof MMap> (
        messageName: M, hearer: (message: MMap[M]) => void)
    => { cancel: () => void };

export type AddAnswerAsyncFunction
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>> =
        <Q extends QuestionName<MMap, QMap>> (
            question: Q, answerer: (message: MMap[Q]) => Promise<MMap[AnswerName<MMap, QMap, Q>]>)
            => { cancel: () => void };

export type AddAnswerFunction
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>> =
        <Q extends QuestionName<MMap, QMap>> (
            question: Q, answerer: (message: MMap[Q]) => MMap[AnswerName<MMap, QMap, Q>])
            => { cancel: () => void };

export function getEventEmitterTeller<MMap extends MessageMap>(eventBus: EventEmitter): TellFunction<MMap> {
    return (name: any, message: any) => {
        eventBus.emit(name, message);
    };
}

export function getEventEmitterHearer<MMap extends MessageMap>(eventBus: EventEmitter): AddHearFunction<MMap> {
    return (name: any, handler: (message: any) => void) => {
        eventBus.addListener(name, handler);

        return {
            cancel: () => eventBus.removeListener(name, handler),
        };
    };
}

interface IFullQuestion {
    message: any;
    id: string;
}

export function getEventEmitterAnswerer
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>>(
        eventBus: EventEmitter): AddAnswerAsyncFunction<MMap, QMap> {

    return  (questionName: any, answerer: (message: any) => Promise<any>) => {
        const listener = (question: IFullQuestion) => {
            answerer(question.message).then((reply) => {
                eventBus.emit("REPLY_" + questionName + "_" + question.id, reply);
            });
        };
        eventBus.addListener("ASK_" + questionName, listener);

        return {
            cancel: () => eventBus.removeListener("ASK_" + questionName, listener),
        };
    };
}

export function getEventEmitterAsker
    <MMap extends MessageMap, QMap extends QuestionMap<MMap>>(
        eventBus: EventEmitter) {

    const func: AskAsyncFunction<MMap, QMap> = async (questionName: any, question: any): Promise<any> => {
        return await new Promise((resolve) => {
            const messageID = Math.random().toString(36).substring(7);

            eventBus.once("REPLY_" + questionName + "_" + messageID, (reply: any) => {
                resolve(reply);
            });
            eventBus.emit("ASK_" + questionName, {
                message: question,
                id: messageID,
            } as IFullQuestion);
        });
    };

    return func;
}
