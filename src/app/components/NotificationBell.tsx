import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCircle, Clock, BookOpen, Award, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppData } from "../context/AppContext";
import type { Notification, NotificationType } from "../lib/types";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  registration: BookOpen,
  score: Award,
  approval: CheckCircle,
  course: BookOpen,
  system: Bell,
  user: Bell,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationItem({ n, onRead, onClick }: {
  n: Notification;
  onRead: () => void;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[n.type] || Bell;
  return (
    <button
      type="button"
      onClick={() => { onRead(); onClick(); }}
      className={`w-full text-left flex gap-3 p-3 rounded-xl transition-colors hover:bg-muted/60 ${n.read ? "opacity-70" : "bg-accent/5 border border-accent/10"}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? "bg-muted" : "bg-accent/15"}`}>
        <Icon className={`w-4 h-4 ${n.read ? "text-muted-foreground" : "text-accent"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold truncate ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
          {!n.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {timeAgo(n.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, onNavigate } = useAppData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div>
                <p className="text-sm font-bold text-foreground font-[Outfit]">Notifications</p>
                <p className="text-[10px] text-muted-foreground">{unreadCount} unread</p>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[10px] text-accent font-semibold px-2 py-1 rounded hover:bg-accent/10 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded lg:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You'll be notified about registrations, scores, and approvals here.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onRead={() => markRead(n.id)}
                    onClick={() => {
                      if (n.link) onNavigate(n.link);
                      setOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
