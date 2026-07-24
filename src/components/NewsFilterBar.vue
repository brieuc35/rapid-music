<template>
  <div class="filter-bar">
    <ion-searchbar
      :value="filter.query"
      placeholder="Rechercher une actu, un artiste…"
      :debounce="300"
      @ionInput="onQuery($event)"
    ></ion-searchbar>

    <div class="selects">
      <ion-select
        :value="filter.genre ?? ''"
        interface="popover"
        placeholder="Genre"
        aria-label="Filtrer par genre"
        @ionChange="onGenre($event)"
      >
        <ion-select-option value="">Tous genres</ion-select-option>
        <ion-select-option v-for="g in genres" :key="g" :value="g">{{ g }}</ion-select-option>
      </ion-select>

      <ion-select
        :value="filter.sourceId ?? ''"
        interface="popover"
        placeholder="Source"
        aria-label="Filtrer par source"
        @ionChange="onSource($event)"
      >
        <ion-select-option value="">Toutes sources</ion-select-option>
        <ion-select-option v-for="s in sources" :key="s.id" :value="s.id">{{ s.name }}</ion-select-option>
      </ion-select>

      <ion-button v-if="hasActiveFilter" fill="clear" size="small" @click="$emit('reset')">
        Réinitialiser
      </ion-button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import {
  IonButton,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue';
import { ArticleFilter, MusicGenre, Source } from '@/models';

const GENRES: MusicGenre[] = [
  'pop', 'rap', 'rock', 'electro', 'jazz', 'rnb', 'metal', 'classique', 'reggae', 'kpop',
];

export default defineComponent({
  name: 'NewsFilterBar',
  components: { IonButton, IonSearchbar, IonSelect, IonSelectOption },
  props: {
    filter: { type: Object as PropType<ArticleFilter>, required: true },
    sources: { type: Array as PropType<Source[]>, default: () => [] },
  },
  emits: ['update:filter', 'change', 'reset'],
  setup(props, { emit }) {
    const hasActiveFilter = computed(
      () => Boolean(props.filter.query || props.filter.genre || props.filter.sourceId),
    );

    function apply(patch: Partial<ArticleFilter>) {
      emit('update:filter', { ...props.filter, ...patch });
      emit('change');
    }

    // En Ionic 5, ionInput.detail est l'événement natif (pas { value }) : on lit
    // la valeur depuis l'élément ion-searchbar cible. ion-select expose bien detail.value.
    return {
      genres: GENRES,
      hasActiveFilter,
      onQuery: (e: CustomEvent) => {
        const value = (e.target as HTMLIonSearchbarElement | null)?.value;
        apply({ query: value ? value.trim() : undefined });
      },
      onGenre: (e: CustomEvent) => apply({ genre: (e.detail.value as MusicGenre) || undefined }),
      onSource: (e: CustomEvent) => apply({ sourceId: (e.detail.value as string) || undefined }),
    };
  },
});
</script>

<style scoped>
.filter-bar {
  padding: 4px 8px 8px;
  border-bottom: 1px solid var(--ion-color-light-shade, #e0e0e0);
}
.selects {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}
ion-select {
  max-width: 45%;
  --padding-start: 8px;
  border: 1px solid var(--ion-color-light-shade, #d7d8da);
  border-radius: 20px;
  font-size: 13px;
}
</style>
