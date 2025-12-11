import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

const POLLING_INTERVAL = 30000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { toast } = useToast();
  const lastSeenNotificationId = useRef<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  const loadNotifications = async (showToast = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchNotifications();
      if (showToast && data.length > 0 && data[0].id !== lastSeenNotificationId.current) {
        toast({
          title: "Novo agendamento",
          description: `${data[0].data.cliente} confirmou ${data[0].data.horario}`,
        });
        lastSeenNotificationId.current = data[0].id;
      } else if (!lastSeenNotificationId.current && data.length > 0) {
        lastSeenNotificationId.current = data[0].id;
      }
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => loadNotifications(true), POLLING_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas como lidas.",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0 ? "Tudo lido" : `${unreadCount} novo${unreadCount > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" disabled={unreadCount === 0} onClick={handleMarkAll} className="text-xs">
            <CheckCheck className="mr-1 h-3 w-3" />
            Marcar tudo
          </Button>
        </div>
        <div className="max-h-80 divide-y divide-border overflow-auto">
          {loading && notifications.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando
            </div>
          )}
          {!loading && notifications.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum alerta por aqui.</p>
          )}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-muted/70 ${
                notification.read_at ? "bg-background" : "bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{notification.data.cliente}</p>
                {!notification.read_at && <Badge variant="secondary">Novo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {notification.data.data} às {notification.data.horario} · {notification.data.service ?? "Serviço"}
              </p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
