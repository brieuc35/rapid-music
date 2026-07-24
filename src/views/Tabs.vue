<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="feed" href="/tabs/feed">
          <ion-icon :icon="newspaperOutline" />
          <ion-label>Fil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="clips" href="/tabs/clips">
          <ion-icon :icon="playCircleOutline" />
          <ion-label>Clips</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="news" href="/tabs/news">
          <ion-icon :icon="musicalNotesOutline" />
          <ion-label>Actus</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { newspaperOutline, playCircleOutline, musicalNotesOutline } from 'ionicons/icons';

export default {
  name: 'Tabs',
  components: { IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage, IonRouterOutlet },
  setup() {
    return {
      newspaperOutline,
      playCircleOutline,
      musicalNotesOutline,
    }
  }
}
</script>
