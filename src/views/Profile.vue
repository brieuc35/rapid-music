<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Profil</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Réglages">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--rm-text)"><path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1l-.4-2.5H10l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L5.6 11a7.8 7.8 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.4 2.5h4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" /></svg>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Bannière + identité -->
      <div class="banner"></div>
      <div class="page">
        <div class="identity">
          <div class="cover avatar" :class="me.avatar">{{ me.initials }}</div>
          <button class="edit">Modifier</button>
        </div>

        <h1 class="name">{{ me.name }}</h1>
        <div class="rm-muted handle">{{ me.handle }} · {{ me.location }}</div>
        <p class="bio">{{ me.bio }}</p>

        <!-- Stats -->
        <div class="stats rm-card">
          <div class="stat"><div class="num">{{ me.stats.shares }}</div><div class="rm-muted lbl">Partages</div></div>
          <div class="stat"><div class="num">{{ format(me.stats.followers) }}</div><div class="rm-muted lbl">Abonnés</div></div>
          <div class="stat"><div class="num">{{ me.stats.following }}</div><div class="rm-muted lbl">Abonnements</div></div>
        </div>

        <!-- Genres favoris (compétences) -->
        <h2 class="section-title">Genres favoris</h2>
        <div class="chips">
          <span v-for="g in me.genres" :key="g" class="rm-chip active">{{ g }}</span>
        </div>

        <!-- Titres du moment (objectifs) -->
        <h2 class="section-title">En ce moment</h2>
        <div class="favs">
          <div v-for="t in favorites" :key="t.id" class="fav rm-card">
            <div class="cover art" :class="t.cover">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
            </div>
            <div class="f-meta">
              <div class="f-title">{{ t.title }}</div>
              <div class="rm-muted f-artist">{{ t.artist }}</div>
            </div>
            <span class="rm-muted f-dur">{{ t.duration }}</span>
          </div>
        </div>

        <!-- Parcours musical (expériences / timeline) -->
        <h2 class="section-title">Parcours musical</h2>
        <div class="timeline">
          <div v-for="m in journey" :key="m.year" class="milestone">
            <div class="col">
              <span class="year">{{ m.year }}</span>
              <span class="line"></span>
            </div>
            <div class="ms-body rm-card">
              <div class="ms-title">{{ m.title }}</div>
              <div class="rm-muted ms-detail">{{ m.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton } from '@ionic/vue';
import { currentUser, currentFavorites, journey } from '@/data/social';

export default defineComponent({
  name: 'Profile',
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton },
  setup() {
    const format = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n));
    return { me: currentUser, favorites: currentFavorites, journey, format };
  },
});
</script>

<style scoped>
.banner { height: 120px; background: linear-gradient(135deg, #eb445a, #5260ff, #3dc2ff); }
.page { padding: 0 16px 28px; max-width: 640px; margin: 0 auto; }

.identity { display: flex; align-items: flex-end; justify-content: space-between; margin-top: -42px; }
.avatar {
  width: 88px; height: 88px; border-radius: 24px; color: #fff; font-weight: 800; font-size: 1.6rem;
  border: 4px solid var(--rm-bg); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}
.edit { padding: 8px 18px; border-radius: 999px; border: 1px solid var(--rm-border); background: var(--rm-card); color: var(--rm-text); font-weight: 700; font-size: 0.82rem; cursor: pointer; }

.name { font-size: 1.55rem; font-weight: 800; letter-spacing: -0.02em; margin: 14px 0 2px; }
.handle { font-size: 0.88rem; }
.bio { font-size: 0.95rem; margin: 12px 0 0; line-height: 1.55; }

.stats { display: flex; margin: 20px 0 6px; padding: 16px 0; }
.stat { flex: 1; text-align: center; }
.stat + .stat { border-left: 1px solid var(--rm-border); }
.num { font-size: 1.4rem; font-weight: 800; }
.lbl { font-size: 0.78rem; }

.section-title { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; margin: 26px 0 14px; }
.chips { display: flex; flex-wrap: wrap; gap: 9px; }

.favs { display: flex; flex-direction: column; gap: 10px; }
.fav { display: flex; align-items: center; gap: 13px; padding: 11px; }
.fav .art { width: 48px; height: 48px; border-radius: 11px; }
.f-meta { flex: 1; min-width: 0; }
.f-title { font-weight: 700; font-size: 0.92rem; }
.f-artist { font-size: 0.8rem; }
.f-dur { font-size: 0.82rem; font-variant-numeric: tabular-nums; }

.timeline { display: flex; flex-direction: column; }
.milestone { display: flex; gap: 16px; }
.col { display: flex; flex-direction: column; align-items: center; width: 52px; flex-shrink: 0; }
.year {
  font-weight: 800; font-size: 0.8rem; color: #fff; padding: 4px 0; width: 100%; text-align: center;
  background: linear-gradient(135deg, var(--rm-primary), var(--rm-tertiary)); border-radius: 8px;
}
.line { flex: 1; width: 2px; background: var(--rm-border); margin: 6px 0; }
.milestone:last-child .line { display: none; }
.ms-body { flex: 1; padding: 13px 15px; margin-bottom: 14px; }
.ms-title { font-weight: 700; font-size: 0.92rem; }
.ms-detail { font-size: 0.82rem; margin-top: 3px; }
</style>
