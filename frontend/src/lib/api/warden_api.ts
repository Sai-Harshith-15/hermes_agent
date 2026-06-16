const BASE_URL = 'http://localhost:8000/api/v1';

export const wardenApi = {
  getEvents: async () => {
    const res = await fetch(`${BASE_URL}/warden/events`);
    return res.json();
  },
  triggerProbe: async () => {
    const res = await fetch(`${BASE_URL}/warden/trigger_probe`, { method: 'POST' });
    return res.json();
  },
  triggerLoopDetection: async () => {
    const res = await fetch(`${BASE_URL}/warden/trigger_loop_detection`, { method: 'POST' });
    return res.json();
  }
};
