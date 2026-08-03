/**
 * Gestion du thème clair / sombre (§7.3).
 *
 * Le choix explicite est stocké dans localStorage et posé en attribut
 * data-theme sur <html> ; sans choix, on suit la préférence système.
 */
import { ref } from 'vue';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'rm-theme';
const isDark = ref(false);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode);
  isDark.value = mode === 'dark';
}

/** Appelé au démarrage (avant le montage) pour éviter tout flash. */
export function initTheme(): void {
  const stored = (typeof localStorage !== 'undefined'
    && localStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
  apply(stored ?? (systemPrefersDark() ? 'dark' : 'light'));
}

export function useTheme() {
  function toggle(): void {
    const next: ThemeMode = isDark.value ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* stockage indisponible : le thème reste appliqué pour la session */
    }
  }

  return { isDark, toggle };
}
