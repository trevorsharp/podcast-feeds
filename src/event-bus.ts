import EventEmitter from 'node:events';

import type { FeedDataWithContent } from './types';

type Events = {
  'feed-data-with-content-loaded': FeedDataWithContent;
  'content-missing': { contentId: string };
};

type EventName = keyof Events;

export const createEventBus = () => {
  const eventEmitter = new EventEmitter();

  const sendEvent = <TEventName extends EventName>(eventName: TEventName, data: Events[TEventName]) =>
    eventEmitter.emit(eventName, data);

  const addEventListener = <TEventName extends EventName>(
    eventName: TEventName,
    listener: (data: Events[TEventName]) => void,
  ) => eventEmitter.on(eventName, listener);

  return { sendEvent, addEventListener };
};

export type EventBus = ReturnType<typeof createEventBus>;
