# Les images et l'aperçu de la fiche App Store

Treize fichiers vont dans **App Store Connect → votre app → la version iOS →
Aperçus et captures d'écran**. Le quatorzième attend ailleurs — voir plus bas.

| Fichier | Taille | Ce que c'est |
| --- | --- | --- |
| `apercu-iphone-886x1920.mp4` | 886 × 1920 | l'aperçu vidéo, 24 s |
| `iphone-6.9-*.png` | 1320 × 2868 | six captures, iPhone 6,9 pouces |
| `iphone-6.7-*.png` | 1290 × 2796 | les six mêmes, iPhone 6,7 pouces |
| `iphone-6.5-*.png` | 1284 × 2778 | les six mêmes, iPhone 6,5 pouces |
| `illustration-promo-4320x1080.png` | 4320 × 1080 | l'illustration promotionnelle — **pas encore téléversable** |
| `verification-abonnement.png` | 860 × 3874 | la capture d'examen de l'abonnement — **va ailleurs**, voir ci-dessous |

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

## La capture d'examen de l'abonnement

Celle-ci ne va pas sur la fiche. Elle se dépose dans **App Store Connect →
Monétisation → Abonnements → chacun des deux abonnements → Informations
destinées à l'équipe de vérification → Capture d'écran**.

Elle est **obligatoire**, et sa raison d'être est étroite : c'est par elle que
le vérificateur trouve l'achat dans l'application. La même image sert pour
`pro_mensuel` et pour `pro_annuel`.

C'est l'écran d'abonnement tel qu'il s'affiche **dans l'application iPhone** —
pas sur le site, qui n'y montre aucun bouton d'achat et ne prouverait donc rien.
Le script pose pour cela le pont natif qu'un iPhone fournit ; la page, elle, est
la vraie, et les montants viennent de `src/store/index.ts`.

Pleine hauteur, et non la hauteur d'un écran : les deux formules, leurs prix et
le tableau comparatif tiennent sur une seule image.

## L'illustration promotionnelle

C'est le pendant Apple de l'image de mise en avant du Play Store. Trois choses
la distinguent, et il vaut mieux les savoir avant de la chercher.

**Son emplacement n'existe pas tant qu'Apple ne l'ouvre pas.** Il n'apparaît
dans App Store Connect que si l'équipe éditoriale retient l'application pour
l'onglet Aujourd'hui. Inutile de le chercher aujourd'hui : le fichier est
fabriqué d'avance, pour le jour où.

**Aucun texte.** Apple l'interdit ici et pose lui-même le nom de l'application
par-dessus. D'où l'absence de la signature et des mots-clés qui portent l'image
du Play Store.

**Elle est recadrée sans qu'on le demande**, et pas toujours au même rapport :
la même illustration sert de bandeau très large sur une fiche et de vignette
presque carrée dans l'onglet Aujourd'hui. La composition est donc symétrique et
tout ce qui compte tient dans le carré central — vérifié en 4:1, en 2:1 et en
carré.

Pour un bandeau avec du texte — site, dossier de presse, réseaux — c'est
`play-store/mise-en-avant-1024x500.png` qui sert : même marque, même fond, mais
la signature et les mots-clés en plus.

## Pourquoi trois tailles de captures

Apple n'accepte **que les dimensions exactes** d'un appareil : pas de mise à
l'échelle, pas d'« à peu près ». Une image d'un pixel de trop est refusée, et
le message d'erreur arrive après qu'on a rempli tout le reste du formulaire.

Or l'emplacement proposé n'est pas le même pour tout le monde : il dépend de la
version d'App Store Connect et des appareils que l'application déclare. Le
formulaire a d'abord réclamé du **6,5 pouces** alors que seuls le 6,9 et le 6,7
existaient ici.

| Classe | Dimensions | Appareils |
| --- | --- | --- |
| 6,9 pouces | 1320 × 2868 | les Pro Max récents |
| 6,7 pouces | 1290 × 2796 | ce que le 6,9 réclamait avant eux |
| 6,5 pouces | 1284 × 2778 | la classe précédente |

Les trois sont donc produites. **Envoyez celle que le formulaire réclame** — il
l'écrit noir sur blanc dans son message d'erreur. Un seul emplacement suffit :
Apple dérive les autres tailles tout seul, à partir de la plus grande fournie.

Apple accepte aussi 1242 × 2688 dans le créneau des 6,5 pouces. Si c'est celle
que votre formulaire exige, elle s'ajoute en une ligne dans le script.

Le lien **« Afficher toutes les tailles dans le gestionnaire des visuels »**, en
haut à droite de la page, ouvre les autres emplacements — c'est là qu'on trouve
le 6,9 pouces quand la page n'affiche que le 6,5.

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
