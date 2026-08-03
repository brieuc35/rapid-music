<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/feed"></ion-back-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="!unreadCount" @click="markAllRead">Tout lire</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="state">Chargement…</div>
      <div v-else-if="!items.length" class="state">Aucune notification pour le moment.</div>

      <button
        v-for="notif in items"
        :key="notif.id"
        class="notif"
        :class="{ unread: !notif.read }"
        @click="openActor(notif)"
      >
        <div class="icon" :style="{ background: iconColor(notif.type) }">
          <ion-icon :icon="iconFor(notif.type)" />
        </div>
        <div class="body">
          <p class="text">
            <strong v-if="notif.actor">{{ notif.actor.displayName }}</strong>
            {{ notif.actor ? ' ' + notif.text : notif.text }}
          </p>
          <span class="time">{{ timeAgo(notif.createdAt) }}</span>
        </div>
        <span v-if="!notif.read" class="dot" aria-label="non lu"></span>
      </button>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import {
  atOutline,
  chatbubbleOutline,
  heart,
  megaphoneOutline,
  personAddOutline,
} from 'ionicons/icons';
import { AppNotification, NotificationType } from '@/models';
import { timeAgo } from '@/utils/format';
import { useNotifications } from '@/composables/useNotifications';

const ICONS: Record<NotificationType, string> = {
  follow: personAddOutline,
  like: heart,
  comment: chatbubbleOutline,
  mention: atOutline,
  system: megaphoneOutline,
};

const COLORS: Record<NotificationType, string> = {
  follow: '#3880ff',
  like: '#eb445a',
  comment: '#2dd36f',
  mention: '#6a64ff',
  system: '#92949c',
};

export default defineComponent({
  name: 'NotificationsPage',
  components: {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonPage,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const router = useRouter();
    const { items, unreadCount, loading, load, markAllRead } = useNotifications();

    onMounted(load);

    function openActor(notif: AppNotification) {
      if (notif.actor) router.push(`/profile/${notif.actor.handle}`);
    }

    return {
      items,
      unreadCount,
      loading,
      markAllRead,
      openActor,
      timeAgo,
      iconFor: (t: NotificationType) => ICONS[t],
      iconColor: (t: NotificationType) => COLORS[t],
    };
  },
});
</script>

<style scoped>
.state {
  text-align: center;
  color: var(--ion-color-medium, #92949c);
  padding: 40px 16px;
}
.notif {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 14px 16px;
  border-bottom: 1px solid var(--rm-border);
  cursor: pointer;
}
.notif.unread {
  background: rgba(var(--ion-color-primary-rgb), 0.07);
}
.icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.icon ion-icon {
  font-size: 20px;
}
.body {
  flex: 1;
  min-width: 0;
}
.text {
  margin: 0 0 2px;
  line-height: 1.4;
}
.time {
  color: var(--ion-color-medium, #92949c);
  font-size: 12px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ion-color-primary, #3880ff);
  flex-shrink: 0;
}
</style>
