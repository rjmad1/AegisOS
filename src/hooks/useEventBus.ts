import * as React from 'react';
import { EventBus } from '@/platform/event-bus/EventBus';
import type { PlatformEventMap, EventSubscriptionOptions } from '@/platform/event-bus/types';

export function useEventBus() {
  const subscribe = React.useCallback(
    <K extends keyof PlatformEventMap & string>(
      event: K,
      handler: (payload: PlatformEventMap[K]) => void,
      options?: EventSubscriptionOptions
    ) => {
      const sub = EventBus.subscribe(event, handler, options);
      return () => {
        EventBus.unsubscribe(sub.id);
      };
    },
    []
  );

  return {
    publish: EventBus.publish.bind(EventBus),
    subscribe,
    getHistory: EventBus.getHistory.bind(EventBus),
  };
}
