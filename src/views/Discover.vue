<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Découvrir</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" class="ion-no-border">
        <ion-toolbar>
          <ion-title size="large">Découvrir</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page">
        <!-- Recherche -->
        <div class="search rm-card">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--rm-muted)"><path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" /></svg>
          <input v-model="query" type="text" placeholder="Titres, artistes, mélomanes…" aria-label="Rechercher" />
        </div>

        <!-- Filtres par genre -->
        <section class="genres">
          <button v-for="g in genres" :key="g" class="rm-chip" :class="{ active: g === genre }" @click="genre = g">
            {{ g }}
          </button>
        </section>

        <!-- Tendances -->
        <h2 class="section-title">Tendances<span v-if="genre !== 'Tous'" class="rm-muted"> · {{ genre }}</span></h2>
        <div class="grid">
          <article v-for="(t, i) in trending" :key="t.id" class="tile rm-card">
            <div class="cover art" :class="t.cover">
              <span class="rank">{{ i + 1 }}</span>
              <button class="play" :aria-label="'Écouter ' + t.title">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>
            <div class="t-title">{{ t.title }}</div>
            <div class="rm-muted t-artist">{{ t.artist }}</div>
          </article>
        </div>

        <!-- Mélomanes à suivre -->
        <h2 class="section-title">Mélomanes à suivre</h2>
        <div class="people">
          <div v-for="u in suggestions" :key="u.id" class="person rm-card">
            <div class="cover avatar" :class="u.avatar">{{ u.initials }}</div>
            <div class="p-meta">
              <div class="p-name">{{ u.name }}</div>
              <div class="rm-muted p-handle">{{ u.handle }}</div>
            </div>
            <button class="follow" :class="{ following: followed.has(u.id) }" @click="toggleFollow(u.id)">
              {{ followed.has(u.id) ? 'Suivi' : 'Suivre' }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { trending, genres, suggestions } from '@/data/social';

export default defineComponent({
  name: 'Discover',
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent },
  setup() {
    const query = ref('');
    const genre = ref('Tous');
    const followed = ref(new Set<string>());
    const toggleFollow = (id: string) => {
      followed.value.has(id) ? followed.value.delete(id) : followed.value.add(id);
    };
    return { query, genre, genres, trending, suggestions, followed, toggleFollow };
  },
});
</script>

<style scoped>
.page { padding: 4px 16px 24px; max-width: 720px; margin: 0 auto; }

.search { display: flex; align-items: center; gap: 10px; padding: 12px 16px; margin-bottom: 18px; }
.search input { flex: 1; background: transparent; border: none; outline: none; color: var(--rm-text); font-size: 0.95rem; }
.search input::placeholder { color: var(--rm-muted); }

.genres { display: flex; gap: 9px; overflow-x: auto; padding-bottom: 18px; scrollbar-width: none; }
.genres::-webkit-scrollbar { display: none; }
.genres .rm-chip { flex-shrink: 0; }

.section-title { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; margin: 8px 0 14px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; margin-bottom: 10px; }
.tile { padding: 10px; }
.tile .art { width: 100%; aspect-ratio: 1; border-radius: 12px; position: relative; margin-bottom: 10px; }
.tile .rank {
  position: absolute; top: 8px; left: 8px; font-weight: 800; font-size: 0.85rem; color: #fff;
  background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 1px 8px;
}
.tile .play {
  position: absolute; bottom: 8px; right: 8px; width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--rm-primary), var(--rm-primary-tint));
  display: grid; place-items: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.tile .play svg { fill: #fff; }
.t-title { font-weight: 700; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t-artist { font-size: 0.8rem; }

.people { display: flex; flex-direction: column; gap: 10px; }
.person { display: flex; align-items: center; gap: 12px; padding: 12px; }
.avatar { width: 46px; height: 46px; border-radius: 12px; color: #fff; font-weight: 700; font-size: 0.9rem; }
.p-meta { flex: 1; min-width: 0; }
.p-name { font-weight: 700; font-size: 0.92rem; }
.p-handle { font-size: 0.8rem; }
.follow {
  padding: 8px 18px; border-radius: 999px; border: 1px solid transparent; cursor: pointer; font-weight: 700; font-size: 0.82rem;
  background: linear-gradient(135deg, var(--rm-primary), var(--rm-primary-tint)); color: #fff;
}
.follow.following { background: transparent; border-color: var(--rm-border); color: var(--rm-muted); }
</style>
