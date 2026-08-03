<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="cancel">Annuler</ion-button>
      </ion-buttons>
      <ion-title>Nouveau post</ion-title>
      <ion-buttons slot="end">
        <ion-button strong :disabled="!canPublish" @click="submit">
          {{ publishing ? 'Publication…' : 'Publier' }}
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <div class="author-row">
      <UserAvatar :user="currentUser" :size="44" />
      <div class="author">
        <span class="name">{{ currentUser.displayName }}</span>
        <ion-select
          :value="visibility"
          interface="popover"
          aria-label="Visibilité du post"
          class="visibility"
          @ionChange="onVisibility($event)"
        >
          <ion-select-option value="public">🌍 Public</ion-select-option>
          <ion-select-option value="followers">👥 Abonnés</ion-select-option>
        </ion-select>
      </div>
    </div>

    <ion-textarea
      class="body-input"
      :auto-grow="true"
      :rows="4"
      :maxlength="MAX_LENGTH"
      placeholder="Quoi de neuf côté musique ?"
      :value="body"
      @ionInput="onBody($event)"
    ></ion-textarea>

    <div class="counter" :class="{ warn: remaining <= 20 }">{{ remaining }}</div>

    <!-- Tags -->
    <div class="tags" v-if="tags.length">
      <ion-chip v-for="tag in tags" :key="tag" @click="removeTag(tag)">
        <ion-label>#{{ tag }}</ion-label>
        <ion-icon :icon="closeCircle" />
      </ion-chip>
    </div>
    <ion-input
      v-if="tags.length < MAX_TAGS"
      class="tag-input"
      placeholder="Ajouter un tag (Entrée pour valider)"
      :value="tagDraft"
      @ionInput="onTagDraft($event)"
      @keyup.enter="addTag"
    ></ion-input>

    <!-- Photo optionnelle -->
    <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
    <div v-if="imageUrl" class="image-preview">
      <img :src="imageUrl" alt="Aperçu de la photo" />
      <ion-button fill="solid" size="small" class="remove-image" @click="imageUrl = ''">
        <ion-icon :icon="closeCircle" slot="icon-only" />
      </ion-button>
    </div>

    <div class="attach-row">
      <ion-button v-if="!imageUrl" fill="clear" size="small" @click="pickImage">
        <ion-icon :icon="imageOutline" slot="start" />
        Ajouter une photo
      </ion-button>
      <ion-button v-if="!showLink" fill="clear" size="small" @click="showLink = true">
        <ion-icon :icon="linkOutline" slot="start" />
        Ajouter un lien
      </ion-button>
    </div>
    <div v-if="showLink" class="link-fields">
      <ion-input
        placeholder="https://…"
        inputmode="url"
        :value="linkUrl"
        @ionInput="onLinkUrl($event)"
      ></ion-input>
      <ion-input
        placeholder="Titre du lien (optionnel)"
        :value="linkTitle"
        @ionInput="onLinkTitle($event)"
      ></ion-input>
    </div>
  </ion-content>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController,
  toastController,
} from '@ionic/vue';
import { closeCircle, imageOutline, linkOutline } from 'ionicons/icons';
import { MediaAttachment, PostVisibility } from '@/models';
import { createPost } from '@/services/api';
import { currentUser } from '@/services/mockData';
import UserAvatar from './UserAvatar.vue';

const MAX_LENGTH = 500;
const MAX_TAGS = 5;

/** Valeur courante d'un champ Ionic (detail.value indisponible en Ionic 5). */
function targetValue(e: Event): string {
  return (e.target as HTMLIonInputElement | HTMLIonTextareaElement | null)?.value?.toString() ?? '';
}

export default defineComponent({
  name: 'PostComposer',
  components: {
    UserAvatar,
    IonButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const body = ref('');
    const tags = ref<string[]>([]);
    const tagDraft = ref('');
    const showLink = ref(false);
    const linkUrl = ref('');
    const linkTitle = ref('');
    const visibility = ref<PostVisibility>('public');
    const publishing = ref(false);
    const fileInput = ref<HTMLInputElement | null>(null);
    const imageUrl = ref('');

    function pickImage() {
      fileInput.value?.click();
    }

    // Lecture locale en data URL. En prod : upload vers le stockage objet via
    // URL pré-signée (§4.4), puis on stocke l'URL renvoyée par le back-end.
    function onFile(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { imageUrl.value = String(reader.result); };
      reader.readAsDataURL(file);
    }

    const remaining = computed(() => MAX_LENGTH - body.value.length);
    const canPublish = computed(
      () => body.value.trim().length > 0 && remaining.value >= 0 && !publishing.value,
    );

    function addTag() {
      const normalized = tagDraft.value.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');
      if (normalized && tags.value.length < MAX_TAGS && !tags.value.includes(normalized)) {
        tags.value.push(normalized);
      }
      tagDraft.value = '';
    }

    function removeTag(tag: string) {
      tags.value = tags.value.filter((t) => t !== tag);
    }

    async function submit() {
      if (!canPublish.value) return;
      publishing.value = true;
      try {
        const media: MediaAttachment[] = [];
        if (imageUrl.value) {
          media.push({ type: 'image', url: imageUrl.value });
        }
        if (showLink.value && linkUrl.value.trim()) {
          media.push({ type: 'link', url: linkUrl.value.trim(), title: linkTitle.value.trim() || undefined });
        }
        const post = await createPost({
          body: body.value,
          tags: tags.value,
          media,
          visibility: visibility.value,
        });
        const toast = await toastController.create({ message: 'Post publié ✨', duration: 1500 });
        await toast.present();
        await modalController.dismiss(post);
      } finally {
        publishing.value = false;
      }
    }

    function cancel() {
      modalController.dismiss();
    }

    return {
      currentUser,
      body,
      tags,
      tagDraft,
      showLink,
      linkUrl,
      linkTitle,
      visibility,
      publishing,
      fileInput,
      imageUrl,
      pickImage,
      onFile,
      remaining,
      canPublish,
      MAX_LENGTH,
      MAX_TAGS,
      addTag,
      removeTag,
      submit,
      cancel,
      onBody: (e: Event) => (body.value = targetValue(e)),
      onTagDraft: (e: Event) => (tagDraft.value = targetValue(e)),
      onLinkUrl: (e: Event) => (linkUrl.value = targetValue(e)),
      onLinkTitle: (e: Event) => (linkTitle.value = targetValue(e)),
      onVisibility: (e: CustomEvent) => (visibility.value = e.detail.value as PostVisibility),
      closeCircle,
      imageOutline,
      linkOutline,
    };
  },
});
</script>

<style scoped>
.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.author {
  display: flex;
  flex-direction: column;
}
.name {
  font-weight: 700;
}
.visibility {
  font-size: 13px;
  --padding-start: 0;
  max-width: 160px;
}
.body-input {
  font-size: 17px;
  --padding-start: 0;
}
.counter {
  text-align: right;
  font-size: 12px;
  color: var(--ion-color-medium, #92949c);
  margin-bottom: 12px;
}
.counter.warn {
  color: var(--ion-color-danger, #eb445a);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.tag-input {
  --padding-start: 0;
  font-size: 14px;
  border-bottom: 1px solid var(--rm-border);
}
.attach-row {
  display: flex;
  gap: 4px;
  margin-top: 12px;
}
.attach-row ion-button {
  --padding-start: 4px;
  --padding-end: 8px;
}
.image-preview {
  position: relative;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
}
.image-preview img {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  display: block;
}
.remove-image {
  position: absolute;
  top: 6px;
  right: 6px;
  --padding-start: 6px;
  --padding-end: 6px;
  --background: rgba(0, 0, 0, 0.55);
}
.link-fields {
  margin-top: 12px;
  border: 1px solid var(--rm-border);
  border-radius: 12px;
  padding: 4px 12px;
}
</style>
