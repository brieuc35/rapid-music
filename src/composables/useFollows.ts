/**
 * Store d'abonnements partagé (§2.1 « système d'abonnements »).
 *
 * État module-level : une seule source de vérité pour tout l'app, afin que
 * suivre un créateur dans le Feed se reflète aussitôt sur son profil et ailleurs.
 * À brancher plus tard sur POST /api/v1/users/:id/follow.
 */
import { reactive, computed } from 'vue';
import { User } from '@/models';

const followedIds = reactive<Set<string>>(new Set());

export function useFollows() {
  function isFollowing(userId: string): boolean {
    return followedIds.has(userId);
  }

  function toggleFollow(user: User): boolean {
    if (followedIds.has(user.id)) {
      followedIds.delete(user.id);
      user.followerCount = Math.max(0, user.followerCount - 1);
      return false;
    }
    followedIds.add(user.id);
    user.followerCount += 1;
    return true;
  }

  const followingCount = computed(() => followedIds.size);

  return { isFollowing, toggleFollow, followingCount };
}
