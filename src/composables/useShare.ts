/**
 * Feuille de partage réutilisable (§2.2 / §2.3).
 *
 * Présente un ion-action-sheet avec : republier (posts uniquement), copier le
 * lien, et partage natif (Web Share API si disponible). `onShared` est appelé
 * dès qu'une action de partage aboutit (pour incrémenter le compteur).
 */
import { actionSheetController, toastController } from '@ionic/vue';
import { linkOutline, repeatOutline, shareSocialOutline } from 'ionicons/icons';

interface ShareOptions {
  link: string;
  title: string;
  onRepost?: () => void | Promise<void>;
  onShared?: () => void;
}

async function toast(message: string): Promise<void> {
  const t = await toastController.create({ message, duration: 1400 });
  await t.present();
}

async function copyLink(link: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(link);
    await toast('Lien copié 🔗');
  } catch {
    await toast(link);
  }
}

export function useShare() {
  async function openShare(opts: ShareOptions): Promise<void> {
    const buttons = [];

    if (opts.onRepost) {
      buttons.push({
        text: 'Republier dans mon fil',
        icon: repeatOutline,
        handler: () => {
          Promise.resolve(opts.onRepost?.()).then(() => opts.onShared?.());
        },
      });
    }

    buttons.push({
      text: 'Copier le lien',
      icon: linkOutline,
      handler: () => {
        copyLink(opts.link).then(() => opts.onShared?.());
      },
    });

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      buttons.push({
        text: 'Partager via…',
        icon: shareSocialOutline,
        handler: () => {
          navigator
            .share({ title: opts.title, url: opts.link })
            .then(() => opts.onShared?.())
            .catch(() => undefined);
        },
      });
    }

    buttons.push({ text: 'Annuler', role: 'cancel' });

    const sheet = await actionSheetController.create({ header: 'Partager', buttons });
    await sheet.present();
  }

  return { openShare };
}
