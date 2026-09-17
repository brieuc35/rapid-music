# Les captures d'écran de la fiche App Store

Douze fichiers, six écrans en deux tailles. À téléverser dans **App Store
Connect → votre app → la version iOS → Aperçus et captures d'écran**.

| Fichier | Taille | Emplacement |
| --- | --- | --- |
| `iphone-6.9-*.png` | 1320 × 2868 | iPhone 6,9 pouces |
| `iphone-6.7-*.png` | 1290 × 2796 | iPhone 6,7 pouces |

## Pourquoi deux tailles

Apple n'accepte **que les dimensions exactes** d'un appareil : pas de mise à
l'échelle, pas d'« à peu près ». Une image d'un pixel de trop est refusée.

Or la classe « 6,9 pouces » a changé de définition avec les appareils : le
1320 × 2868 des Pro Max récents a remplacé le 1290 × 2796 des précédents.
Selon la version d'App Store Connect qu'on a sous les yeux, c'est l'un ou
l'autre emplacement qui est proposé.

Les deux sont donc produites. **Envoyez celle que le formulaire réclame** ; il
suffit de remplir l'emplacement de la plus grande taille disponible, Apple
dérive les autres tout seul.

**L'ordre compte** — c'est celui des numéros, et les deux ou trois premières
sont les seules que la plupart des gens verront. Il se règle par
glisser-déposer dans la Console.

## Refaire la série

L'interface change ; une fiche qui montre une version d'il y a trois mois se
remarque.

```sh
node scripts/fiche-play-store.mjs
```

La même commande refait **tout** : les treize images du Play Store et ces douze
là. Les six captures d'écran sont prises une seule fois et servent aux trois
formats — seul l'habillage change. Il lui faut **Playwright**, absent des
dépendances du projet parce qu'il pèse plus lourd que l'application et ne sert
qu'ici :

```sh
npm i -D playwright && npx playwright install chromium
```

## Ce qui figure sur les images

Les données de démonstration livrées avec l'application — l'artiste NOVA, ses
concerts, ses sorties. Rien n'est inventé : ce sont les écrans réels, avec les
chiffres réels de cette démonstration.

Deux écrans ont demandé une mise en scène, décrite dans le script :

- **Tâches** — la démonstration le laisse vide, et une capture d'écran vide ne
  montre pas ce que fait l'application. Cinq tâches sont ajoutées, telles que le
  formulaire de l'application les produirait.
- **Concerts** — le filtre « À venir » est activé : une date passée en tête de
  liste n'est pas ce qu'on montre d'un agenda de tournée.

## Ce qui n'est pas ici

**L'icône.** Elle ne se téléverse pas dans App Store Connect : elle est
embarquée dans le paquet, et vient de
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`. Voir `scripts/icones.mjs`.
