<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ comments.length }} commentaire{{ comments.length > 1 ? 's' : '' }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="close">Fermer</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <div v-if="loading" class="state">Chargement…</div>
    <div v-else-if="!comments.length" class="state">Sois le premier à commenter 💬</div>

    <div v-for="comment in comments" :key="comment.id" class="comment">
      <UserAvatar :user="comment.author" :size="36" />
      <div class="bubble">
        <div class="meta">
          <span class="name">{{ comment.author.displayName }}</span>
          <span class="time">· {{ timeAgo(comment.createdAt) }}</span>
        </div>
        <p class="text">{{ comment.body }}</p>
        <button class="like" :aria-label="`${comment.likeCount} j'aime`">
          <ion-icon :icon="heartOutline" />
          <span v-if="comment.likeCount">{{ compactNumber(comment.likeCount) }}</span>
        </button>
      </div>
    </div>
  </ion-content>

  <ion-footer>
    <ion-toolbar>
      <div class="composer">
        <UserAvatar :user="currentUser" :size="32" />
        <ion-input
          class="field"
          placeholder="Ajouter un commentaire…"
          :value="draft"
          :disabled="sending"
          @ionInput="onDraft($event)"
          @keyup.enter="send"
        ></ion-input>
        <ion-button fill="clear" :disabled="!canSend" @click="send" aria-label="Envoyer">
          <ion-icon :icon="sendOutline" slot="icon-only" />
        </ion-button>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from 'vue';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue';
import { heartOutline, sendOutline } from 'ionicons/icons';
import { CommentTargetType } from '@/models';
import { compactNumber, timeAgo } from '@/utils/format';
import { useComments } from '@/composables/useComments';
import { currentUser } from '@/services/mockData';
import UserAvatar from './UserAvatar.vue';

export default defineComponent({
  name: 'CommentSheet',
  components: {
    UserAvatar,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonIcon,
    IonInput,
    IonTitle,
    IonToolbar,
  },
  props: {
    targetType: { type: String as PropType<CommentTargetType>, required: true },
    targetId: { type: String, required: true },
    // Callback fourni par le parent (propriétaire du post/clip réactif) pour
    // incrémenter son compteur de commentaires — évite de muter une prop.
    afterAdd: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const { comments, loading, sending, load, add } = useComments(props.targetType, props.targetId);
    const draft = ref('');

    const canSend = computed(() => draft.value.trim().length > 0 && !sending.value);

    onMounted(load);

    async function send() {
      if (!canSend.value) return;
      const comment = await add(draft.value);
      if (comment) {
        props.afterAdd?.();
        draft.value = '';
      }
    }

    return {
      currentUser,
      comments,
      loading,
      sending,
      draft,
      canSend,
      send,
      close: () => modalController.dismiss(),
      onDraft: (e: Event) => (draft.value = (e.target as HTMLIonInputElement | null)?.value?.toString() ?? ''),
      timeAgo,
      compactNumber,
      heartOutline,
      sendOutline,
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
.comment {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
}
.bubble {
  min-width: 0;
  flex: 1;
}
.meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.name {
  font-weight: 700;
  font-size: 14px;
}
.time {
  color: var(--ion-color-medium, #92949c);
  font-size: 12px;
}
.text {
  margin: 2px 0 4px;
  line-height: 1.4;
}
.like {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  color: var(--ion-color-medium, #92949c);
  font-size: 12px;
}
.like ion-icon {
  font-size: 16px;
}
.composer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}
.field {
  flex: 1;
  --padding-start: 12px;
  --background: var(--ion-color-light, #f4f5f8);
  border-radius: 20px;
}
</style>
