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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
