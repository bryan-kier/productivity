import localforage from "localforage";
import { sendHttpRequest } from "./network";

const QUEUE_KEY = "taskflow-offline-queue";
const storage = localforage.createInstance({
  name: "taskflow",
  storeName: "offlineQueue",
});

export interface OfflineOperation {
  method: string;
  url: string;
  body?: unknown;
  timestamp: number;
}

export interface OfflineQueueFlushResult {
  processed: number;
  remaining: number;
}

let isFlushing = false;
const queueListeners = new Set<(length: number) => void>();

async function getQueue() {
  return (await storage.getItem<OfflineOperation[]>(QUEUE_KEY)) ?? [];
}

async function setQueue(queue: OfflineOperation[]) {
  await storage.setItem(QUEUE_KEY, queue);
}

function notifyQueueLength(length: number) {
  queueListeners.forEach((listener) => listener(length));
}

export async function getOfflineQueueLength() {
  return (await getQueue()).length;
}

export function subscribeToQueueLength(listener: (length: number) => void) {
  queueListeners.add(listener);
  void getOfflineQueueLength()
    .then((length) => {
      if (queueListeners.has(listener)) {
        listener(length);
      }
    })
    .catch(() => {
      /* ignore */
    });
  return () => queueListeners.delete(listener);
}

export async function enqueueOfflineOperation({
  method,
  url,
  body,
}: {
  method: string;
  url: string;
  body?: unknown;
}) {
  const queue = await getQueue();
  queue.push({ method, url, body, timestamp: Date.now() });
  await setQueue(queue);
  notifyQueueLength(queue.length);
}

export async function flushOfflineQueue(): Promise<OfflineQueueFlushResult> {
  if (isFlushing) {
    return { processed: 0, remaining: await getOfflineQueueLength() };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { processed: 0, remaining: await getOfflineQueueLength() };
  }

  isFlushing = true;

  try {
    const queue = await getQueue();
    if (!queue.length) {
      return { processed: 0, remaining: 0 };
    }

    let processed = 0;
    let remaining: OfflineOperation[] = [];

    for (let i = 0; i < queue.length; i += 1) {
      const operation = queue[i];
      try {
        await sendHttpRequest({
          method: operation.method,
          url: operation.url,
          body: operation.body,
        });
        processed += 1;
      } catch (error) {
        remaining = queue.slice(i);
        console.error("Failed to replay offline request", operation, error);
        break;
      }
    }

    await setQueue(remaining);
    notifyQueueLength(remaining.length);

    return { processed, remaining: remaining.length };
  } finally {
    isFlushing = false;
  }
}
