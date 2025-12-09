import { useEffect, useState, useRef } from "react";
import { flushOfflineQueue, subscribeToQueueLength, getOfflineQueueLength } from "@/lib/offline";
import { queryClient } from "@/lib/queryClient";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queueLength, setQueueLength] = useState(0);
  const hasFlushedRef = useRef(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Flush the queue when coming back online
      try {
        const result = await flushOfflineQueue();
        if (result.processed > 0) {
          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries();
        }
      } catch (error) {
        console.error("Failed to flush offline queue:", error);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      hasFlushedRef.current = false;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to queue length changes
    const unsubscribe = subscribeToQueueLength((length) => {
      setQueueLength(length);
    });

    // Check initial online status and flush if needed (only once on mount)
    if (!hasFlushedRef.current && typeof navigator !== "undefined" && navigator.onLine) {
      getOfflineQueueLength().then((length) => {
        if (length > 0) {
          hasFlushedRef.current = true;
          void handleOnline();
        }
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  return { isOnline, queueLength };
}
