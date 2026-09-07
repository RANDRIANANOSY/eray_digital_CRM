import { useNavigate } from "react-router";
import { Bell, CheckCheck, Mail, CalendarClock, Trophy, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/api/useNotifications";
import type { NotificationDto, NotificationType } from "@/lib/api/types";

const TYPE_META: Record<NotificationType, { icon: typeof Mail; label: string }> = {
  activity_assigned: { icon: Mail, label: "Email" },
  activity_reminder: { icon: CalendarClock, label: "Rappel" },
  opportunity_won: { icon: Trophy, label: "Gagnée" },
  opportunity_lost: { icon: Trophy, label: "Perdue" },
  system: { icon: Info, label: "Système" },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const { data: countData } = useUnreadNotificationCount();
  const unread = countData?.count ?? 0;
  const { data: listData } = useNotifications({ perPage: 10 });
  const items = listData?.items ?? [];
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleOpen = (n: NotificationDto) => {
    if (!n.read) {
      markRead.mutate(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-cy="notifications-trigger"
          className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground group"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center px-1 ring-2 ring-background">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" data-cy="notifications-content">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5">
                {unread} non lue{unread > 1 ? "s" : ""}
              </span>
            )}
          </DropdownMenuLabel>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu
            </button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.system;
                const Icon = meta.icon;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleOpen(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
                        n.read ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-7 w-7 shrink-0 rounded-full grid place-items-center ${
                          n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold">{n.title}</span>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] text-muted-foreground/70">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full h-8 text-[12px]"
            onClick={() => navigate("/notifications")}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
