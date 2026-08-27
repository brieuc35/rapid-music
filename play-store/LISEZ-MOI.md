# Les images de la fiche Play Store

Sept fichiers, à téléverser dans **Play Console → Développer la présence →
Fiche Play Store principale**.

| Fichier | Où il va | Format exigé |
| --- | --- | --- |
| `mise-en-avant-1024x500.png` | *Image de mise en avant* | 1024 × 500, exactement |
| `capture-1-tableau-de-bord.png` | *Captures d'écran du téléphone* | 1080 × 2160 |
| `capture-2-concerts.png` | idem | 1080 × 2160 |
| `capture-3-agenda.png` | idem | 1080 × 2160 |
| `capture-4-taches.png` | idem | 1080 × 2160 |
| `capture-5-sorties.png` | idem | 1080 × 2160 |
| `capture-6-profil.png` | idem | 1080 × 2160 |

L'icône, elle, ne vient pas d'ici : c'est `public/icon-512.png`.

**L'ordre des captures compte** — c'est celui de la liste, et les deux
premières sont les seules que la plupart des gens verront. Il se règle par
glisser-déposer dans la Console.

## Pourquoi 1080 × 2160 et non 1080 × 2340

Google refuse une capture dont le grand côté dépasse le double du petit.
Le format réel d'un téléphone récent — 1080 × 2340 — est à 2,17 : il serait
rejeté. 1080 × 2160 est exactement 2:1, la limite acceptée.

## Refaire la série

L'interface change ; une fiche qui montre une version d'il y a trois mois se
remarque.

```sh
node scripts/fiche-play-store.mjs
```

Une seule commande refait les sept images, à l'identique. Le script démarre le
serveur de développement, le pilote, et l'arrête. Il lui faut **Playwright** —
absent des dépendances du projet, parce qu'il pèse plus lourd que
l'application et ne sert qu'ici :

```sh
npm i -D playwright && npx playwright install chromium
```

## Ce qui figure sur les captures

Les données de démonstration livrées avec l'application — l'artiste NOVA, ses
concerts, ses sorties. Rien n'est inventé : ce sont les écrans réels, avec les
chiffres réels de cette démonstration.

Seul l'écran **Tâches** reçoit un ajout : la démonstration le laisse vide, et
une capture d'un écran vide ne montre pas ce que fait l'application. Les cinq
tâches ajoutées sont celles qu'un artiste écrirait, et le formulaire de
l'application les produirait telles quelles. La liste est dans le script.
