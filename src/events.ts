import EventEmitter from 'node:events';

import type { FeedDataWithContent } from './types';

const eventEmitter = new EventEmitter();

type Events = {
  'feed-data-with-content-loaded': FeedDataWithContent;
  'content-missing': { contentId: string };
};

type EventName = keyof Events;

export const sendEvent = <TEventName extends EventName>(eventName: TEventName, data: Events[TEventName]) =>
  eventEmitter.emit(eventName, data);

export const addEventListener = <TEventName extends EventName>(
  eventName: TEventName,
  listener: (data: Events[TEventName]) => void,
) => eventEmitter.on(eventName, listener);
