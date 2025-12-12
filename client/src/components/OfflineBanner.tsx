import { useOffline } from "@/hooks/use-offline";
import { Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function OfflineBanner() {
  const { isOnline, queueLength } = useOffline();
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSyncedCount, setLastSyncedCount] = useState(0);

  useEffect(() => {
    if (isOnline && queueLength === 0 && lastSyncedCount > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (queueLength > lastSyncedCount) {
      setLastSyncedCount(queueLength);
    }
  }, [isOnline, queueLength, lastSyncedCount]);

  if (isOnline && queueLength === 0 && !showSuccess) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showSuccess || !isOnline || queueLength > 0) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              {showSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">
                    Changes synced successfully
                  </span>
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-600">
                    You're offline. Changes will sync when you're back online.
                  </span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600">
                    Syncing {queueLength} pending change{queueLength !== 1 ? "s" : ""}...
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}




