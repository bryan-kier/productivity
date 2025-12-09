export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface SendHttpRequestOptions {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function sendHttpRequest({
  method,
  url,
  body,
  headers,
}: SendHttpRequestOptions) {
  const payload = body ? JSON.stringify(body) : undefined;
  const mergedHeaders = body
    ? { "Content-Type": "application/json", ...headers }
    : headers;

  const res = await fetch(url, {
    method,
    headers: mergedHeaders,
    credentials: "include",
    body: payload,
  });

  await throwIfResNotOk(res);
  return res;
}
