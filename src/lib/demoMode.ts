export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
export const DEMO_CHANNEL = 'cafe-demo-sync';

export function broadcastDemo(msg: { type: string; [key: string]: unknown }) {
  const ch = new BroadcastChannel(DEMO_CHANNEL);
  ch.postMessage(msg);
  ch.close();
}
