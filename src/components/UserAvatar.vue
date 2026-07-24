<template>
  <div class="avatar" :style="avatarStyle">
    <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" />
    <span v-else class="initials" aria-hidden="true">{{ initials(user.displayName) }}</span>
    <ion-icon
      v-if="user.isVerified"
      class="verified"
      :icon="checkmarkCircle"
      :aria-label="`${user.displayName} — compte vérifié`"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { IonIcon } from '@ionic/vue';
import { checkmarkCircle } from 'ionicons/icons';
import { User } from '@/models';
import { colorFromString, initials } from '@/utils/format';

export default defineComponent({
  name: 'UserAvatar',
  components: { IonIcon },
  props: {
    user: { type: Object as PropType<User>, required: true },
    size: { type: Number, default: 44 },
  },
  setup(props) {
    const avatarStyle = computed(() => ({
      width: `${props.size}px`,
      height: `${props.size}px`,
      background: colorFromString(props.user.id),
      fontSize: `${Math.round(props.size / 2.6)}px`,
    }));
    return { avatarStyle, initials, checkmarkCircle };
  },
});
</script>

<style scoped>
.avatar {
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  overflow: visible;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.initials {
  line-height: 1;
}
.verified {
  position: absolute;
  right: -2px;
  bottom: -2px;
  color: var(--ion-color-primary, #3880ff);
  background: #fff;
  border-radius: 50%;
  font-size: 40%;
}
</style>
