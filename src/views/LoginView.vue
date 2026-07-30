<template>
  <div class="login">
    <div class="login__card">
      <div class="login__brand">
        <div class="brand__mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 17V4l11-2v13"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="6" cy="17" r="3" stroke="#fff" stroke-width="2" />
            <circle cx="17" cy="15" r="3" stroke="#fff" stroke-width="2" />
          </svg>
        </div>
        <div class="login__title">Rapid<b>Music</b></div>
      </div>

      <p class="login__lead">Vous êtes déconnecté. Reprenez là où vous en étiez.</p>

      <button class="profile-btn" @click="login">
        <Avatar
          :name="store.artist.stageName"
          :photo="store.artist.photo"
          :size="52"
          radius="16px"
          :font="18"
        />
        <div class="profile-btn__text">
          <div class="profile-btn__name">{{ store.artist.stageName }}</div>
          <div class="profile-btn__sub">{{ store.artist.genre || 'Artiste' }}</div>
        </div>
        <Icon name="up" class="profile-btn__chevron" />
      </button>

      <button class="btn btn--primary btn--block" @click="login">
        <Icon name="check" /> Se connecter
      </button>

      <p class="login__note">
        RapidMusic fonctionne hors ligne : vos données sont enregistrées dans ce navigateur,
        sans compte ni mot de passe.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import { store, login } from '@/store'
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--nav-bg);
  background-image: radial-gradient(90% 70% at 15% 0%, rgba(139, 92, 246, 0.35), transparent 60%),
    radial-gradient(80% 70% at 100% 100%, rgba(236, 72, 153, 0.3), transparent 60%);
}
.login__card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 34px 30px 28px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  text-align: center;
}
.login__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
}
.brand__mark {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.35);
}
.brand__mark svg {
  width: 23px;
  height: 23px;
}
.login__title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.login__title b {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.login__lead {
  color: var(--text-soft);
  font-size: 14.5px;
  margin-bottom: 22px;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px;
  border-radius: 15px;
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
  text-align: left;
  margin-bottom: 14px;
  transition: border-color 0.15s, background 0.15s;
}
.profile-btn:hover {
  border-color: var(--violet-400);
  background: var(--violet-50);
}
.profile-btn__text {
  flex: 1;
  min-width: 0;
}
.profile-btn__name {
  font-weight: 700;
  font-size: 15.5px;
}
.profile-btn__sub {
  color: var(--text-muted);
  font-size: 13px;
}
.profile-btn__chevron {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transform: rotate(90deg);
  flex-shrink: 0;
}

.login__note {
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.5;
  margin-top: 18px;
}
</style>
