<template>
  <div class="page">
    <PageHeader title="Tâches" subtitle="Ce qu'il reste à faire, et ce qui est déjà réglé.">
      <template #actions>
        <button class="btn btn--primary" @click="openNew">
          <Icon name="plus" /> Nouvelle tâche
        </button>
      </template>
    </PageHeader>

    <!-- Compteurs. Le retard est la seule information qui mérite d'alerter :
         le nombre de tâches ouvertes ne dit rien de l'urgence. -->
    <div v-if="store.tasks.length" class="tallies">
      <button class="chip" :class="{ 'chip--active': filter === 'à faire' }" @click="filter = 'à faire'">
        À faire · {{ open.length }}
      </button>
      <button class="chip" :class="{ 'chip--active': filter === 'faites' }" @click="filter = 'faites'">
        Faites · {{ done.length }}
      </button>
      <button class="chip" :class="{ 'chip--active': filter === 'toutes' }" @click="filter = 'toutes'">
        Toutes
      </button>
      <span v-if="overdueTasks.length" class="late">
        <Icon name="clock" />
        {{ overdueTasks.length }} en retard
      </span>
    </div>

    <div v-if="visible.length" class="list">
      <div
        v-for="t in visible"
        :key="t.id"
        class="task"
        :class="{ 'task--done': t.done, 'task--late': isLate(t) }"
      >
        <!-- Une vraie case à cocher, et non un bouton qui y ressemble : le
             clavier et les lecteurs d'écran la reconnaissent sans qu'on ait à
             réexpliquer ce qu'elle fait. -->
        <label class="task__check">
          <input
            type="checkbox"
            :checked="t.done"
            :aria-label="t.done ? `Rouvrir : ${t.title}` : `Marquer comme faite : ${t.title}`"
            @change="toggleTask(t)"
          />
        </label>

        <div class="task__main">
          <div class="task__title">{{ t.title }}</div>
          <div class="task__meta">
            <span class="tag" :class="`tag--${slug(t.category)}`">{{ t.category }}</span>
            <span v-if="t.priority !== 'Normale'" class="tag tag--prio" :class="`tag--${slug(t.priority)}`">
              {{ t.priority }}
            </span>
            <span v-if="t.due && !t.done" class="task__due" :class="{ 'task__due--late': isLate(t) }">
              <Icon name="calendar" />
              {{ dueLabel(t.due) }}
            </span>
            <span v-else-if="t.done && t.doneAt" class="task__due">
              <Icon name="check" />
              Faite le {{ formatDate(t.doneAt) }}
            </span>
            <span v-if="t.notes" class="task__note">{{ t.notes }}</span>
          </div>
        </div>

        <div class="task__acts">
          <button class="icon-sm" title="Modifier" aria-label="Modifier" @click="openEdit(t)">
            <Icon name="edit" />
          </button>
          <button class="icon-sm icon-sm--danger" title="Supprimer" aria-label="Supprimer" @click="toDelete = t">
            <Icon name="trash" />
          </button>
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="store.tasks.length"
      icon="check"
      :title="filter === 'faites' ? 'Rien de terminé pour l’instant' : 'Rien à faire'"
      :text="
        filter === 'faites'
          ? 'Les tâches cochées viendront s’afficher ici.'
          : 'Tout est réglé. Profitez-en.'
      "
    />

    <EmptyState
      v-else
      icon="check"
      title="Aucune tâche"
      text="Notez ce qu'il y a à faire : une relance, un dossier à envoyer, une déclaration."
    >
      <button class="btn btn--primary" @click="openNew">
        <Icon name="plus" /> Nouvelle tâche
      </button>
    </EmptyState>

    <Modal
      :open="showForm"
      :title="editing.id ? 'Modifier la tâche' : 'Nouvelle tâche'"
      @close="showForm = false"
    >
      <div class="field">
        <label for="t-title">Intitulé</label>
        <input id="t-title" v-model="editing.title" maxlength="140" placeholder="Ex : relancer le label" />
      </div>
      <div class="field--row">
        <div class="field">
          <label for="t-cat">Catégorie</label>
          <select id="t-cat" v-model="editing.category">
            <option v-for="c in CATEGORIES" :key="c">{{ c }}</option>
          </select>
        </div>
        <div class="field">
          <label for="t-prio">Priorité</label>
          <select id="t-prio" v-model="editing.priority">
            <option v-for="p in PRIORITIES" :key="p">{{ p }}</option>
          </select>
        </div>
        <div class="field">
          <label for="t-due">Échéance</label>
          <input id="t-due" v-model="editing.due" type="date" />
        </div>
      </div>
      <div class="field" style="margin-bottom: 0">
        <label for="t-notes">Notes</label>
        <textarea id="t-notes" v-model="editing.notes" rows="3" />
      </div>
      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.title.trim()" @click="save">
          <Icon name="check" /> Enregistrer
        </button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!toDelete"
      :label="toDelete?.title"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { store, upsert, remove, uid, toggleTask, overdueTasks } from '@/store'
import type { Task, TaskCategory, TaskPriority } from '@/store/types'
import { formatDate } from '@/utils/format'

const CATEGORIES: TaskCategory[] = [
  'Concert',
  'Sortie',
  'Contrat',
  'Studio',
  'Promotion',
  'Administratif',
  'Autre',
]
const PRIORITIES: TaskPriority[] = ['Haute', 'Normale', 'Basse']

const today = () => new Date().toISOString().slice(0, 10)

/*  Le jour même n'est pas un retard : on a jusqu'au soir pour s'en occuper. */
const isLate = (t: Task) => !t.done && !!t.due && t.due < today()

/* -------------------------------------------------------------------------- */
/*  Tri et filtres                                                           */
/* -------------------------------------------------------------------------- */

type Filter = 'à faire' | 'faites' | 'toutes'
const filter = ref<Filter>('à faire')

const RANG: Record<TaskPriority, number> = { Haute: 0, Normale: 1, Basse: 2 }

/*  Les tâches à faire sont rangées par échéance : c'est la seule question qu'on
 *  se pose en ouvrant l'onglet. À échéance égale, la priorité tranche. Celles
 *  sans date passent en dernier — elles n'attendent personne. */
const open = computed(() =>
  store.tasks
    .filter((t) => !t.done)
    .slice()
    .sort((a, b) => {
      if (!!a.due !== !!b.due) return a.due ? -1 : 1
      if (a.due !== b.due) return a.due < b.due ? -1 : 1
      return RANG[a.priority] - RANG[b.priority]
    }),
)

/*  Les tâches faites, de la plus récente à la plus ancienne : on cherche à
 *  retrouver ce qu'on vient de terminer, pas ce qui était dû en premier. */
const done = computed(() =>
  store.tasks
    .filter((t) => t.done)
    .slice()
    .sort((a, b) => (a.doneAt > b.doneAt ? -1 : 1)),
)

const visible = computed(() => {
  if (filter.value === 'à faire') return open.value
  if (filter.value === 'faites') return done.value
  return [...open.value, ...done.value]
})

/** Une échéance se lit mieux en jours qu'en date, tant qu'elle est proche. */
function dueLabel(due: string): string {
  const jours = Math.round(
    (new Date(`${due}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86_400_000,
  )
  if (jours === 0) return "Aujourd'hui"
  if (jours === 1) return 'Demain'
  if (jours === -1) return 'Hier'
  if (jours < 0) return `Il y a ${-jours} j`
  if (jours <= 14) return `Dans ${jours} j`
  return formatDate(due)
}

/** Classe CSS depuis un libellé accentué : « Administratif » → « administratif ». */
function slug(v: string): string {
  return v
    .normalize('NFD')
    // Échappement plutôt que littéral : ces caractères sont invisibles dans un
    // éditeur et un copier-coller les perdrait sans prévenir.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/* -------------------------------------------------------------------------- */
/*  Formulaire                                                               */
/* -------------------------------------------------------------------------- */

const emptyTask = (): Task => ({
  id: '',
  title: '',
  done: false,
  due: '',
  priority: 'Normale',
  category: 'Autre',
  notes: '',
  doneAt: '',
})
const editing = reactive<Task>(emptyTask())
const showForm = ref(false)

function openNew() {
  Object.assign(editing, emptyTask())
  showForm.value = true
}
function openEdit(t: Task) {
  Object.assign(editing, JSON.parse(JSON.stringify(t)))
  showForm.value = true
}
function save() {
  if (!editing.title.trim()) return
  if (!editing.id) editing.id = uid()
  editing.title = editing.title.trim()
  upsert('tasks', JSON.parse(JSON.stringify(editing)))
  showForm.value = false
}

const toDelete = ref<Task | null>(null)
function confirmDelete() {
  if (toDelete.value) remove('tasks', toDelete.value.id)
  toDelete.value = null
}
</script>

<style scoped>
.tallies {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.late {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: var(--red);
  background: var(--red-bg);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12.5px;
  font-weight: 600;
}
.late svg {
  width: 14px;
  height: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 13px 15px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.15s;
}
.task:hover {
  border-color: var(--violet-200);
}
/* Un liseré rouge à gauche : le retard doit se voir en parcourant la colonne,
   sans lire chaque ligne. */
.task--late {
  border-left: 3px solid var(--red);
}
.task--done {
  background: var(--bg);
  box-shadow: none;
}
.task--done .task__title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task__check {
  display: grid;
  place-items: center;
  padding-top: 2px;
  cursor: pointer;
}
.task__check input {
  width: 19px;
  height: 19px;
  accent-color: var(--violet-600);
  cursor: pointer;
}

.task__main {
  flex: 1;
  min-width: 0;
}
.task__title {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.task__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--text-muted);
}
.task__due {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}
.task__due svg {
  width: 13px;
  height: 13px;
}
.task__due--late {
  color: var(--red);
}
.task__note {
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.tag {
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 20px;
  padding: 2px 9px;
  background: var(--violet-50);
  color: var(--violet-700);
  white-space: nowrap;
}
.tag--concert {
  background: var(--violet-100);
  color: var(--violet-700);
}
.tag--sortie {
  background: var(--blue-bg);
  color: var(--blue);
}
.tag--contrat {
  background: var(--amber-bg);
  color: var(--amber);
}
.tag--studio {
  background: var(--green-bg);
  color: var(--green);
}
.tag--promotion {
  background: rgba(236, 72, 153, 0.12);
  color: var(--pink-500);
}
.tag--administratif,
.tag--autre {
  background: var(--surface-2);
  color: var(--text-soft);
}
/* La priorité n'apparaît que si elle sort de l'ordinaire — l'afficher partout
   la rendrait invisible. */
.tag--haute {
  background: var(--red-bg);
  color: var(--red);
}
.tag--basse {
  background: var(--surface-2);
  color: var(--text-muted);
}

.task__acts {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
/*  Même bouton que dans les autres listes de l'application. À ne pas confondre
 *  avec .icon-btn, qui est blanc sur fond sombre : réutilisé ici, il donnait une
 *  icône blanche sur une carte blanche, donc invisible. */
.icon-sm {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-soft);
  display: grid;
  place-items: center;
}
.icon-sm svg {
  width: 15px;
  height: 15px;
}
.icon-sm:hover {
  background: var(--surface-2);
  color: var(--text);
}
.icon-sm--danger:hover {
  background: var(--red-bg);
  color: var(--red);
  border-color: var(--red-bg);
}
</style>
