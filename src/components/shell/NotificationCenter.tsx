"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/utils/cn";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    markAllRead,
    clear,
    dismiss,
  } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black"
          />
          {/* Slide-out Sidebar Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed bottom-0 right-0 top-0 z-50 w-80 border-l border-border bg-card shadow-2xl glass-panel flex flex-col"
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border/20">
              <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">Operational Logs</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No active notifications.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-3 rounded-lg border text-xs flex flex-col space-y-1 relative group text-left",
                      notif.type === "success" && "border-emerald-500/20 bg-emerald-500/5",
                      notif.type === "warning" && "border-amber-500/20 bg-amber-500/5",
                      notif.type === "error" && "border-destructive/20 bg-destructive/5",
                      notif.type === "info" && "border-sky-500/20 bg-sky-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span
                        className={cn(
                          notif.type === "success" && "text-emerald-500",
                          notif.type === "warning" && "text-amber-500",
                          notif.type === "error" && "text-destructive",
                          notif.type === "info" && "text-sky-500"
                        )}
                      >
                        {notif.title}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="opacity-0 group-hover:opacity-100 ml-1.5 p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-normal">{notif.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border/20 p-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={clear}
                disabled={notifications.length === 0}
              >
                Clear logs
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
