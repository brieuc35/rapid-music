<template>
  <!--  Mise en page commune aux quatre documents. Volontairement autonome :
        ces pages doivent s'ouvrir sans compte, elles ne peuvent donc pas
        s'appuyer sur le menu de l'application. -->
  <div class="legal">
    <header class="legal__top">
      <RouterLink :to="RETOUR" class="legal__brand">
        <span class="legal__mark"><BrandMark /></span>
        <span class="legal__name">Rapid<b>Music</b></span>
      </RouterLink>
      <RouterLink :to="RETOUR" class="btn btn--subtle btn--sm">
        <Icon name="up" class="legal__back-ico" />
        {{ isLoggedIn ? "Retour à l'application" : 'Retour à la connexion' }}
      </RouterLink>
    </header>

    <article class="legal__doc">
      <h1>{{ titre }}</h1>
      <p class="legal__maj">Dernière mise à jour : {{ DATE_MAJ }}</p>
      <slot />
    </article>

    <nav class="legal__foot" aria-label="Autres documents">
      <template v-for="p in AUTRES" :key="p.to">
        <RouterLink v-if="p.to !== route.path" :to="p.to">{{ p.libelle }}</RouterLink>
        <span v-else class="legal__ici" aria-current="page">{{ p.libelle }}</span>
      </template>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import BrandMark from './BrandMark.vue'
import Icon from './Icon.vue'
import { isLoggedIn } from '@/store'
import { DATE_MAJ } from '@/legal'
import { PAGES_LEGALES } from '@/router/legal'

defineProps<{ titre: string }>()

const route = useRoute()

/*  Une adresse de l'application, et non de la connexion : celle-ci n'a pas
 *  d'adresse propre. Sans session, c'est l'écran de connexion qui répond, ce
 *  qui est exactement le comportement voulu. */
const RETOUR = '/tableau-de-bord'

const AUTRES = PAGES_LEGALES
</script>
