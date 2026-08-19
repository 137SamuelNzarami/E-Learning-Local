import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle="Vos notifications personnelles"
        actions={
          notifications.some((n) => !n.lu) ? (
            <button type="button" className="btn-secondary" onClick={markAllRead}>
              Tout marquer comme lu
            </button>
          ) : null
        }
      />

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <Card><EmptyState icon={Icons.notifications} title="Aucune notification" message="Vous serez notifié ici de vos activités." /></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id_notification} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${n.lu ? "text-slate-600" : "text-slate-900"}`}>{n.titre}</p>
                  {!n.lu && <Badge color="brand">Nouveau</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.contenu}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.lu && (
                <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs shrink-0" onClick={() => markRead(n.id_notification)}>
                  Marquer lu
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
