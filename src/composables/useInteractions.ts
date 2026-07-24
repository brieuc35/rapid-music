/**
 * Interactions optimistes (like) partagées par le Feed et les Clips (§2.2 / §2.3).
 *
 * L'UI est mise à jour immédiatement (optimistic UI, cf. US-2) ; l'appel réseau
 * réel (POST /api/v1/:type/:id/reactions) viendra confirmer/annuler ensuite.
 */
import { Clip, Post } from '@/models';

type Likeable = Post | Clip;

export function useInteractions() {
  function toggleLike(target: Likeable): void {
    target.likedByMe = !target.likedByMe;
    target.likeCount += target.likedByMe ? 1 : -1;
  }

  function share(target: Likeable): void {
    target.shareCount += 1;
  }

  return { toggleLike, share };
}
