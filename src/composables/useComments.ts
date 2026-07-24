/**
 * État d'un fil de commentaires (§2.2 / §2.3), partagé par le Fil et les Clips.
 * Chargement + ajout optimiste. À brancher sur GET/POST /api/v1/:type/:id/comments.
 */
import { ref } from 'vue';
import { Comment, CommentTargetType } from '@/models';
import { addComment, fetchComments } from '@/services/api';

export function useComments(type: CommentTargetType, id: string) {
  const comments = ref<Comment[]>([]);
  const loading = ref(false);
  const sending = ref(false);

  async function load(): Promise<void> {
    loading.value = true;
    try {
      comments.value = await fetchComments(type, id);
    } finally {
      loading.value = false;
    }
  }

  async function add(body: string): Promise<Comment | null> {
    const trimmed = body.trim();
    if (!trimmed || sending.value) return null;
    sending.value = true;
    try {
      const comment = await addComment(type, id, trimmed);
      comments.value = [...comments.value, comment];
      return comment;
    } finally {
      sending.value = false;
    }
  }

  return { comments, loading, sending, load, add };
}
