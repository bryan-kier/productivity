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
  // Get auth token from Supabase session
  const { supabase } = await import("./supabase");
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const payload = body ? JSON.stringify(body) : undefined;
  const mergedHeaders: Record<string, string> = {
    ...(body && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: mergedHeaders,
    credentials: "include",
    body: payload,
  });

  await throwIfResNotOk(res);
  return res;
}
