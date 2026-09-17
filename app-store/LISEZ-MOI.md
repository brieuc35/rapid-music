# Les images et l'aperçu de la fiche App Store

Treize fichiers, tous à déposer au même endroit : **App Store Connect → votre
app → la version iOS → Aperçus et captures d'écran**.

| Fichier | Taille | Ce que c'est |
| --- | --- | --- |
| `apercu-iphone-886x1920.mp4` | 886 × 1920 | l'aperçu vidéo, 24 s |
| `iphone-6.9-*.png` | 1320 × 2868 | six captures, iPhone 6,9 pouces |
| `iphone-6.7-*.png` | 1290 × 2796 | les six mêmes, iPhone 6,7 pouces |

## Attention : deux tailles pour le même écran

C'est le piège de cette page. Les captures et l'aperçu s'y déposent ensemble,
sous le même intitulé, et **n'ont pas la même taille**. Un aperçu aux
dimensions des captures est refusé.

En contrepartie, un seul aperçu suffit : le 886 × 1920 couvre toute la gamme
récente — 6,9 / 6,5 / 6,3 / 6,1 pouces.

## L'aperçu vidéo

Vingt-quatre secondes, sans son, une légende par écran. Il traverse le tableau
de bord, les concerts, l'agenda, les tâches, les sorties et les contacts, puis
finit sur la marque.

Il est **facultatif** — la fiche est valable sans lui. Mais c'est la seule
chose de la page qui bouge, et sur iPhone il se lance tout seul.

Deux règles d'Apple ont dicté sa forme :

- **entre 15 et 30 secondes**, sinon l'envoi est refusé ;
- **aucun matériel à l'image**. D'où l'absence de cadre de téléphone, alors que
  les captures, elles, en ont un : Apple l'accepte sur une image fixe et le
  refuse en vidéo.

La piste audio est muette, et non absente : App Store Connect recale au
transcodage les fichiers sans piste son.

## Pourquoi deux tailles de captures

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
node scripts/fiche-play-store.mjs    # les images — Play Store et App Store
node scripts/apercu-app-store.mjs    # l'aperçu vidéo
```

La première commande refait **toutes** les images : les treize du Play Store et
les douze d'ici. Les six écrans sont pris une seule fois et servent aux trois
formats — seul l'habillage change.

Il leur faut deux outils, tenus hors des dépendances du projet parce qu'ils
pèsent plus lourd que l'application et ne servent qu'ici :

```sh
npm i -D playwright @ffmpeg-installer/ffmpeg && npx playwright install chromium
```

`ffmpeg` ne sert qu'à l'aperçu. S'il est déjà installé sur la machine, il est
trouvé tout seul.

## Ce qui figure sur les images

Les données de démonstration livrées avec l'application — l'artiste NOVA, ses
concerts, ses sorties. Ce sont les écrans réels, avec les chiffres réels de
cette démonstration ; rien n'est promis à personne.

Une mise en scène s'y ajoute, décrite dans `scripts/sonde.mjs` :

- **Des dates à venir.** La démonstration livrée avec l'application porte des
  dates écrites en dur, en 2026 ; elles reculent dans le passé à mesure que le
  temps passe, et l'agenda finissait par afficher « aucun évènement à venir ».
  Concerts, séances de studio et tâches sont donc datés par rapport au jour où
  l'on fabrique la fiche : elle restera pleine dans un an.
- **Les coordonnées de l'artiste.** Elles existent dans la démonstration mais
  n'arrivent jamais à l'écran, et c'est voulu — personne ne doit hériter du
  courriel de NOVA en créant son compte. Sans elles, l'écran de profil affichait
  cinq « Non renseigné ».
- **Concerts** — le filtre « À venir » est activé : une date passée en tête de
  liste n'est pas ce qu'on montre d'un agenda de tournée.

## Ce qui n'est pas ici

**L'icône.** Elle ne se téléverse pas dans App Store Connect : elle est
embarquée dans le paquet, et vient de
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`. Voir `scripts/icones.mjs`.
