/**
 * Store de notifications in-app (§2.1 / §5.2).
 *
 * État module-level (singleton) : la pastille de non-lus dans le Fil et la
 * liste de la page Notifications partagent la même source de vérité, donc
 * « tout marquer comme lu » met à jour les deux instantanément.
 */
import { ref } from 'vue';
import { AppNotification } from '@/models';
import { fetchNotifications, fetchUnreadCount, markNotificationsRead } from '@/services/api';

const items = ref<AppNotification[]>([]);
const unreadCount = ref(0);
const loading = ref(false);

export function useNotifications() {
  async function load(): Promise<void> {
    loading.value = true;
    try {
      items.value = await fetchNotifications();
      unreadCount.value = items.value.filter((n) => !n.read).length;
    } finally {
      loading.value = false;
    }
  }

  /** Rafraîchit uniquement la pastille (léger), sans charger toute la liste. */
  async function refreshUnread(): Promise<void> {
    unreadCount.value = await fetchUnreadCount();
  }

  async function markAllRead(): Promise<void> {
    await markNotificationsRead();
    items.value.forEach((n) => { n.read = true; });
    unreadCount.value = 0;
  }

  return { items, unreadCount, loading, load, refreshUnread, markAllRead };
}
