import { sendHttpRequest } from "./network";
import { enqueueOfflineOperation } from "./offline";

function createOfflineResponse() {
  return new Response(
    JSON.stringify({ 
      message: "Queued for offline sync",
      offline: true 
    }),
    {
      status: 202,
      statusText: "Accepted (queued offline)",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

function isOfflineError(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "NetworkError" || error.name === "AbortError";
  }

  return false;
}

function shouldQueueOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

async function queueRequest(method: string, url: string, body?: unknown) {
  await enqueueOfflineOperation({ method, url, body });
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  if (shouldQueueOffline()) {
    await queueRequest(method, url, data);
    return createOfflineResponse();
  }

  try {
    return await sendHttpRequest({ method, url, body: data });
  } catch (error) {
    if (isOfflineError(error)) {
      await queueRequest(method, url, data);
      return createOfflineResponse();
    }
    throw error;
  }
}
