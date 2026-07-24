import { useInteractions } from '@/composables/useInteractions';
import { useFollows } from '@/composables/useFollows';
import { Post, User } from '@/models';

function makeUser(id: string): User {
  return {
    id,
    handle: id,
    displayName: id,
    role: 'creator',
    favoriteGenres: [],
    isVerified: false,
    followerCount: 100,
    followingCount: 0,
  };
}

function makePost(): Post {
  return {
    id: 'p-test',
    author: makeUser('author'),
    body: 'hello',
    media: [],
    tags: [],
    createdAt: '2026-07-24T00:00:00Z',
    likeCount: 10,
    commentCount: 0,
    shareCount: 2,
    likedByMe: false,
  };
}

describe('useInteractions.toggleLike', () => {
  it('bascule le like et ajuste le compteur (optimistic UI)', () => {
    const { toggleLike } = useInteractions();
    const post = makePost();

    toggleLike(post);
    expect(post.likedByMe).toBe(true);
    expect(post.likeCount).toBe(11);

    toggleLike(post);
    expect(post.likedByMe).toBe(false);
    expect(post.likeCount).toBe(10);
  });

  it('incrémente les partages', () => {
    const { share } = useInteractions();
    const post = makePost();
    share(post);
    expect(post.shareCount).toBe(3);
  });
});

describe('useFollows', () => {
  it('bascule l\'abonnement et ajuste le nombre d\'abonnés', () => {
    const { isFollowing, toggleFollow } = useFollows();
    const creator = makeUser('creator-follow');

    expect(isFollowing(creator.id)).toBe(false);
    const nowFollowing = toggleFollow(creator);
    expect(nowFollowing).toBe(true);
    expect(isFollowing(creator.id)).toBe(true);
    expect(creator.followerCount).toBe(101);

    toggleFollow(creator);
    expect(isFollowing(creator.id)).toBe(false);
    expect(creator.followerCount).toBe(100);
  });
});
