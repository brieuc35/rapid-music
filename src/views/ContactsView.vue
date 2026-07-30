<template>
  <div class="page">
    <PageHeader title="Contacts" subtitle="Votre carnet d'adresses professionnel.">
      <template #actions>
        <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Nouveau contact</button>
      </template>
    </PageHeader>

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
import { store, upsert, remove, uid } from '@/store'
import type { Contact } from '@/store/types'

const categories: Contact['category'][] = ['Label', 'Booking', 'Média', 'Studio', 'Management', 'Juridique', 'Autre']
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
  Object.assign(editing, emptyContact())
  showForm.value = true
}
function openEdit(c: Contact) {
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  showForm.value = true
}
function save() {
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
