# Les images de la fiche Play Store

Treize fichiers, à téléverser dans **Play Console → Développer la présence →
Fiche Play Store principale**.

| Fichier | Où il va | Format exigé |
| --- | --- | --- |
| `mise-en-avant-1024x500.png` | *Image de mise en avant* | 1024 × 500, exactement |
| `visuel-1-tableau-de-bord.png` … `visuel-6-profil.png` | *Captures d'écran du téléphone* | 1080 × 1920 |
| `capture-1-tableau-de-bord.png` … `capture-6-profil.png` | en réserve — voir ci-dessous | 1080 × 2160 |

L'icône ne vient pas d'ici : c'est `public/icon-512.png`.

## Visuels ou captures brutes ?

**Envoyez les `visuel-`.** Ce sont les mêmes écrans, posés dans un cadre de
téléphone sur le violet de la marque, avec une phrase au-dessus. Une capture
brute montre l'application ; elle ne dit pas à quoi elle sert. La phrase, si —
et c'est elle qu'on lit en faisant défiler la fiche.

Les `capture-` sont gardées parce qu'elles servent à autre chose : vérifier un
écran, illustrer une réponse au support, ou refaire un visuel sans relancer
toute la chaîne. Elles conviendraient aussi à la fiche, en plus sec.

**L'ordre compte** — c'est celui des numéros, et les deux premières sont les
seules que la plupart des gens verront. Il se règle par glisser-déposer dans la
Console.

## Pourquoi ces formats

Google refuse une capture dont le grand côté dépasse **le double** du petit.

- Les visuels sont en **1080 × 1920** (9:16), le format des fiches soignées.
- Les captures sont en **1080 × 2160**, soit exactement 2:1, la limite. Le
  format réel d'un téléphone récent — 1080 × 2340 — est à 2,17 : il serait
  rejeté.

## Refaire la série

L'interface change ; une fiche qui montre une version d'il y a trois mois se
remarque.

```sh
node scripts/fiche-play-store.mjs
```

Une seule commande refait les treize images, à l'identique — **et les douze
captures de la fiche App Store** au passage, dans `app-store/` : les six écrans
sont pris une seule fois et servent aux trois formats. Le script démarre le
serveur de développement, le pilote, et l'arrête. Il lui faut **Playwright** —
absent des dépendances du projet, parce qu'il pèse plus lourd que l'application
et ne sert qu'ici :

```sh
npm i -D playwright && npx playwright install chromium
```

## Ce qui figure sur les images

Les données de démonstration livrées avec l'application — l'artiste NOVA, ses
concerts, ses sorties. Ce sont les écrans réels, avec les chiffres réels de
cette démonstration ; rien n'est promis à personne.

Une mise en scène s'y ajoute, décrite dans `scripts/sonde.mjs` :

- **Des dates à venir.** La démonstration porte des dates écrites en dur, en
  2026 ; elles reculent dans le passé à mesure que le temps passe, et l'agenda
  finissait par afficher « aucun évènement à venir ». Concerts, séances de
  studio et tâches sont donc datés par rapport au jour où l'on fabrique la
  fiche : elle restera pleine dans un an.
- **Les coordonnées de l'artiste**, qui existent dans la démonstration mais
  n'arrivent jamais à l'écran — et c'est voulu, personne ne doit hériter du
  courriel de NOVA en créant son compte.
- **Concerts** — le filtre « À venir » est activé : une date passée en tête de
  liste n'est pas ce qu'on montre d'un agenda de tournée.

## Et une vidéo ?

Google ne prend pas de fichier : seulement un lien YouTube. L'aperçu vidéo
fabriqué pour Apple — `app-store/apercu-iphone-886x1920.mp4` — pourrait servir,
à condition de le mettre d'abord en ligne sur YouTube.
