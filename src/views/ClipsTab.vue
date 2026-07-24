<template>
  <ion-page>
    <ion-content :fullscreen="true" class="clips-content">
      <div v-if="loading && !clips.length" class="state">Chargement des clips…</div>

      <div class="clips-scroller">
        <ClipPlayer
          v-for="clip in clips"
          :key="clip.id"
          :clip="clip"
          @comment="openComments"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { IonContent, IonPage, toastController } from '@ionic/vue';
import { Clip } from '@/models';
import { useClips } from '@/composables/useClips';
import ClipPlayer from '@/components/ClipPlayer.vue';

export default defineComponent({
  name: 'ClipsTab',
  components: { ClipPlayer, IonContent, IonPage },
  setup() {
    const { clips, loading, refresh } = useClips();

    onMounted(refresh);

    async function openComments(clip: Clip) {
      const toast = await toastController.create({
        message: `Commentaires du clip de @${clip.creator.handle} — à venir`,
        duration: 1500,
      });
      await toast.present();
    }

    return { clips, loading, openComments };
  },
});
</script>

<style scoped>
.clips-content {
  --background: #000;
}
/* Défilement vertical plein écran avec magnétisme (un clip à la fois). */
.clips-scroller {
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}
.clips-scroller > * {
  height: 100%;
}
.state {
  color: #fff;
  text-align: center;
  padding: 32px 16px;
}
</style>
