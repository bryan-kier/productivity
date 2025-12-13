import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { Persister, PersistedClient } from "@tanstack/query-persist-client-core";
import localforage from "localforage";
import { apiRequest } from "./api";
import { throwIfResNotOk } from "./network";

const STORAGE_KEY = "taskflow-query-cache-v1";
const CACHE_STORE = localforage.createInstance({
  name: "taskflow",
  storeName: "reactQueryCache",
});

const persister: Persister = {
  async persistClient(clientState: PersistedClient) {
    await CACHE_STORE.setItem(STORAGE_KEY, clientState);
  },
  async restoreClient() {
    return (await CACHE_STORE.getItem<PersistedClient>(STORAGE_KEY)) ?? undefined;
  },
  async removeClient() {
    await CACHE_STORE.removeItem(STORAGE_KEY);
  },
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token from Supabase session
    const { supabase } = await import("./supabase");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Failed to get session:', sessionError);
      throw new Error('Failed to get authentication session');
    }

    const token = session?.access_token;
    
    if (!token) {
      console.warn('No access token available for request:', queryKey);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error('No authentication token available');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const url = queryKey.join("/") as string;
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (res.status === 401) {
      console.error('Unauthorized request:', url, 'Token:', token.substring(0, 20) + '...');
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      // Retry with new token
      const newToken = refreshedSession.access_token;
      const retryRes = await fetch(url, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
      if (retryRes.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      await throwIfResNotOk(retryRes);
      return await retryRes.json();
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
      retry: false,
      // Queries will be enabled/disabled based on authentication status
      enabled: true, // Will be overridden by individual queries if needed
    },
    mutations: {
      retry: false,
    },
  },
});

const QUERY_PERSISTENCE_BUSTER = "taskflow-v1";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

if (typeof window !== "undefined") {
  const [unsubscribe, restorePromise] = persistQueryClient({
    queryClient,
    persister,
    maxAge: CACHE_TTL,
    buster: QUERY_PERSISTENCE_BUSTER,
  });

  restorePromise.catch(async () => {
    await persister.removeClient();
    unsubscribe();
  });
}

export { apiRequest };
