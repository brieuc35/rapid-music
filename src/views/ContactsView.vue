<template>
  <div class="page">
    <PageHeader title="Contacts" subtitle="Votre carnet d'adresses professionnel.">
      <template #actions>
        <!-- Au-delà de la limite, le bouton mène à l'abonnement plutôt que d'ouvrir
             un formulaire qu'on ne pourrait pas enregistrer : faire remplir six
             champs pour refuser à la fin serait la pire des façons de l'annoncer. -->
        <button v-if="canAddContact" class="btn btn--primary" @click="openNew">
          <Icon name="plus" /> Nouveau contact
        </button>
        <RouterLink v-else to="/abonnement" class="btn btn--primary">
          <Icon name="star" /> Passer à Pro
        </RouterLink>
      </template>
    </PageHeader>

    <!-- Le décompte, avant le mur et non au moment de s'y cogner : on doit savoir
         où l'on en est en ouvrant l'onglet. Rien pour les abonnés, qui n'ont
         aucune limite à surveiller. -->
    <p v-if="!isPro && store.contacts.length" class="quota" :class="{ 'quota--full': !canAddContact }">
      <Icon :name="canAddContact ? 'contacts' : 'star'" />
      <span v-if="canAddContact">
        {{ store.contacts.length }} contact{{ store.contacts.length > 1 ? 's' : '' }}
        sur {{ FREE_CONTACTS }} — la formule gratuite en permet {{ FREE_CONTACTS }}.
      </span>
      <span v-else>
        Vous avez atteint les {{ FREE_CONTACTS }} contacts de la formule gratuite.
        <RouterLink to="/abonnement">Passez à Pro</RouterLink> pour un carnet sans
        limite. Vos contacts actuels restent modifiables.
      </span>
    </p>

    <div class="toolbar">
      <div class="search">
        <Icon name="search" />
        <input v-model="q" placeholder="Rechercher un nom, une société…" />
      </div>
      <div class="chips">
        <button v-for="f in filters" :key="f" class="chip" :class="{ 'chip--active': activeFilter === f }" @click="activeFilter = f">{{ f }}</button>
      </div>
    </div>

    <!-- Favorites -->
    <template v-if="favorites.length && activeFilter === 'Tous' && !q">
      <div class="section-head"><span class="section-head__title">⭐ Favoris</span></div>
      <div class="grid grid--cards" style="margin-bottom: 26px">
        <ContactCard v-for="c in favorites" :key="c.id" :contact="c" @edit="openEdit" @delete="askDelete" @toggle="toggleFav" />
      </div>
      <div class="section-head"><span class="section-head__title">Tous les contacts</span></div>
    </template>

    <div v-if="filtered.length" class="grid grid--cards">
      <ContactCard v-for="c in filtered" :key="c.id" :contact="c" @edit="openEdit" @delete="askDelete" @toggle="toggleFav" />
    </div>

    <EmptyState v-else icon="contacts" title="Aucun contact" text="Ajoutez vos partenaires et collaborateurs.">
      <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Nouveau contact</button>
    </EmptyState>

    <Modal :open="showForm" :title="editing.id ? 'Modifier le contact' : 'Nouveau contact'" @close="showForm = false">
      <div class="field--row">
        <div class="field"><label>Nom</label><input v-model="editing.name" placeholder="Prénom Nom" /></div>
        <div class="field"><label>Fonction</label><input v-model="editing.role" placeholder="Ex : Manager" /></div>
      </div>
      <div class="field--row">
        <div class="field"><label>Société</label><input v-model="editing.company" /></div>
        <div class="field">
          <label>Catégorie</label>
          <select v-model="editing.category"><option v-for="c in categories" :key="c">{{ c }}</option></select>
        </div>
      </div>
      <div class="field--row">
        <div class="field"><label>Email</label><input v-model="editing.email" type="email" /></div>
        <div class="field"><label>Téléphone</label><input v-model="editing.phone" type="tel" /></div>
      </div>
      <label class="check">
        <input type="checkbox" v-model="editing.favorite" /> Marquer comme favori
      </label>
      <div class="field" style="margin-top: 16px"><label>Notes</label><textarea v-model="editing.notes" /></div>
      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.name" @click="save"><Icon name="check" /> Enregistrer</button>
      </template>
    </Modal>

    <ConfirmDialog :open="!!toDelete" :label="toDelete?.name" @cancel="toDelete = null" @confirm="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ContactCard from '@/components/ContactCard.vue'
import { RouterLink } from 'vue-router'
import { store, upsert, remove, uid, isPro, canAddContact, FREE_CONTACTS } from '@/store'
import type { Contact } from '@/store/types'

/*  L'ordre sert à la fois la liste du formulaire et les filtres. « Équipe » est
 *  placée après « Management » : ce sont les deux catégories des personnes qui
 *  entourent l'artiste, et « Autre » reste en dernier. */
const categories: Contact['category'][] = [
  'Label',
  'Booking',
  'Média',
  'Studio',
  'Management',
  'Équipe',
  'Juridique',
  'Autre',
]
const filters = ['Tous', ...categories]

const q = ref('')
const activeFilter = ref('Tous')

const base = computed(() =>
  store.contacts.filter((c) => {
    const matchQ = !q.value || (c.name + c.company + c.role).toLowerCase().includes(q.value.toLowerCase())
    const matchF = activeFilter.value === 'Tous' || c.category === activeFilter.value
    return matchQ && matchF
  }),
)
const favorites = computed(() => store.contacts.filter((c) => c.favorite))
const filtered = computed(() => {
  // when showing "Tous" without filter, favorites already shown above
  if (activeFilter.value === 'Tous' && !q.value) return base.value.filter((c) => !c.favorite)
  return base.value
})

const showForm = ref(false)
const emptyContact = (): Contact => ({
  id: '',
  name: '',
  role: '',
  company: '',
  category: 'Autre',
  email: '',
  phone: '',
  favorite: false,
  notes: '',
})
const editing = reactive<Contact>(emptyContact())

function openNew() {
  if (!canAddContact.value) return
  Object.assign(editing, emptyContact())
  showForm.value = true
}
function openEdit(c: Contact) {
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  showForm.value = true
}
function save() {
  /*  Vérifié ici aussi, et pas seulement sur le bouton : un formulaire resté
   *  ouvert pendant qu'un autre appareil ajoutait des contacts arriverait sinon
   *  à enregistrer au-delà de la limite. La modification d'un contact existant
   *  n'est jamais concernée — elle n'en crée pas un de plus. */
  if (!editing.id && !canAddContact.value) {
    showForm.value = false
    return
  }
  if (!editing.id) editing.id = uid()
  upsert('contacts', JSON.parse(JSON.stringify(editing)))
  showForm.value = false
}
function toggleFav(c: Contact) {
  upsert('contacts', { ...c, favorite: !c.favorite })
}

const toDelete = ref<Contact | null>(null)
function askDelete(c: Contact) {
  toDelete.value = c
}
function confirmDelete() {
  if (toDelete.value) remove('contacts', toDelete.value.id)
  toDelete.value = null
}
</script>

<style scoped>
/* Un rappel, pas une alarme, tant qu'il reste de la place. */
.quota {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 11px 14px;
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text-soft);
}
.quota svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--text-muted);
}
/* Limite atteinte : on passe aux couleurs de l'offre, puisque c'est d'elle
   qu'il s'agit — pas au rouge, il n'y a rien de cassé. */
.quota--full {
  background: var(--violet-50);
  border-color: var(--violet-200);
  color: var(--violet-700);
}
.quota--full svg {
  color: var(--violet-600);
  fill: var(--violet-600);
}
.quota a {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
}

.check {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-soft);
  cursor: pointer;
}
.check input {
  width: 17px;
  height: 17px;
  accent-color: var(--violet-600);
}
</style>
