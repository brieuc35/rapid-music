/**
 * État d'un profil créateur (§1.3 / §2.3) : utilisateur, ses clips et ses posts.
 */
import { ref } from 'vue';
import { Clip, Post, User } from '@/models';
import { fetchCreatorClips, fetchUserPosts, getUserByHandle } from '@/services/api';

export function useProfile(handle: string) {
  const user = ref<User | null>(null);
  const clips = ref<Clip[]>([]);
  const posts = ref<Post[]>([]);
  const loading = ref(false);
  const notFound = ref(false);

  async function load(): Promise<void> {
    loading.value = true;
    notFound.value = false;
    try {
      const found = await getUserByHandle(handle);
      user.value = found;
      if (!found) {
        notFound.value = true;
        return;
      }
      const [creatorClips, userPosts] = await Promise.all([
        fetchCreatorClips(found.id),
        fetchUserPosts(found.id),
      ]);
      clips.value = creatorClips;
      posts.value = userPosts;
    } finally {
      loading.value = false;
    }
  }

  return { user, clips, posts, loading, notFound, load };
}
