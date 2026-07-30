<template>
  <Modal :open="open" title="Confirmer la suppression" @close="$emit('cancel')">
    <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
      Voulez-vous vraiment supprimer
      <b style="color: var(--text)">{{ label || 'cet élément' }}</b> ?
      Cette action est définitive.
    </p>
    <template #footer>
      <button class="btn btn--subtle" @click="$emit('cancel')">Annuler</button>
      <button class="btn btn--danger" @click="$emit('confirm')">
        <Icon name="trash" /> Supprimer
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'
import Icon from './Icon.vue'

defineProps<{ open: boolean; label?: string }>()
defineEmits<{ (e: 'cancel'): void; (e: 'confirm'): void }>()
</script>
