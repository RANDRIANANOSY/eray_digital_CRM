import { useNavigate } from "react-router";
import { Bell, CheckCheck, Mail, CalendarClock, Trophy, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/api/useNotifications";
import type { NotificationDto, NotificationType } from "@/lib/api/types";
import { toast } from "sonner";

const TYPE_META: Record<NotificationType, { icon: typeof Mail; label: string }> = {
  activity_assigned: { icon: Mail, label: "Email" },
  activity_reminder: { icon: CalendarClock, label: "Rappel" },
  opportunity_won: { icon: Trophy, label: "Gagnée" },
  opportunity_lost: { icon: Trophy, label: "Perdue" },
  system: { icon: Info, label: "Système" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ perPage: 50 });
  const items = data?.items ?? [];
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleOpen = (n: NotificationDto) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez ici les emails, appels, rappels et événements vous concernant.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            markAllRead.mutate(undefined, {
              onSuccess: () => toast.success("Toutes les notifications ont été marquées comme lues"),
            })
          }
        >
          <CheckCheck className="h-4 w-4 mr-1" /> Tout marquer lu
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chargement…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Aucune notification pour le moment.
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
                      className={`w-full flex items-start gap-3 px-2 py-3 text-left rounded-lg hover:bg-muted transition-colors ${
                        n.read ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-9 w-9 shrink-0 rounded-full grid place-items-center ${
                          n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{n.title}</span>
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">
                          {formatDate(n.createdAt)} · {meta.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
