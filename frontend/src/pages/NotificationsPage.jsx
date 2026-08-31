import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { notificationServiceExtended } from "../services/notificationService";
import { formatDateTime } from "../utils/format";
import { Icons } from "../components/Icons";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationServiceExtended
      .getByUser(user.id)
      .then((res) => setNotifications(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user.id]);

  const markRead = async (id) => {
    await notificationServiceExtended.markAsRead(id);
    load();
  };

  const markAllRead = async () => {
    await Promise.all(notifications.filter((n) => !n.lu).map((n) => notificationServiceExtended.markAsRead(n.id_notification)));
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Vos notifications personnelles</p>
        </div>
        {notifications.some((n) => !n.lu) && (
          <button type="button" className="btn-secondary" onClick={markAllRead}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <Card><EmptyState icon={Icons.notifications} title="Aucune notification" message="Vous serez notifié ici de vos activités." /></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id_notification} padding={false} className="overflow-hidden">
              <div className={`flex items-start gap-4 px-5 py-4 transition-base hover:bg-slate-50/50 ${!n.lu ? "bg-brand-50/30" : ""}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  !n.lu ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"
                }`}>
                  <Icons.notifications className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${n.lu ? "text-slate-600" : "text-slate-800"}`}>{n.titre}</p>
                    {!n.lu && <Badge tone="info">Nouveau</Badge>}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{n.contenu}</p>
                  <p className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.lu && (
                  <button type="button" className="btn-secondary btn-sm shrink-0" onClick={() => markRead(n.id_notification)}>
                    Marquer lu
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
