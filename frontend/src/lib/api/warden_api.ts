import { fetchApi } from './client';

export const wardenApi = {
  getEvents: async () => {
    return fetchApi('/warden/events');
  },
  triggerProbe: async () => {
    return fetchApi('/warden/trigger_probe', { method: 'POST' });
  },
  triggerLoopDetection: async () => {
    return fetchApi('/warden/trigger_loop_detection', { method: 'POST' });
  },
  heal: async (eventId: number, action: string) => {
    return fetchApi('/warden/heal', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, action })
    });
  }
};
