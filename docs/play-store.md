# Publier RapidMusic sur le Play Store

L'application Android n'est pas un second code source : c'est une **enveloppe**
(_Trusted Web Activity_) qui affiche rapidmusic.fr en plein écran, sans barre
d'adresse. Une mise à jour du site met donc l'application à jour, sans repasser
par Google.

Le site remplit déjà les conditions techniques : manifeste, icônes, ouverture
sans réseau (voir la PR « L'application devient installable et s'ouvre sans
réseau »).

## Décisions définitives

Ces valeurs ne peuvent plus changer après la première publication. Elles sont
figées dans `android/twa-manifest.json`.

| Réglage | Valeur | Remarque |
| --- | --- | --- |
| Identifiant du paquet | `fr.rapidmusic.app` | **Irréversible.** Le changer imposerait de publier une autre application, sans les installations existantes. |
| Nom affiché | RapidMusic | sous l'icône, 12 caractères maximum utiles |
| Nom complet | RapidMusic - Carrière musicale | nom dans le paquet Android, visible dans les réglages du téléphone. Identique au titre de la fiche, pour qu'un seul nom circule |
| Barre d'état | `#14101F` | le sombre de l'en-tête, qu'elle surplombe |
| Barre système du bas | `#FFFFFF` | le blanc de la barre d'onglets, qu'elle prolonge. Voir la réserve ci-dessous |
| Écran de lancement | `#14101F` | enchaîne sans rupture sur l'écran d'attente de l'application |
| Version | 1.0.0 (code 1) | le **code** doit augmenter à chaque envoi |

> **La barre système du bas n'obéit pas toujours.** Sur un téléphone en
> navigation par gestes, Android garde ces quelques pixels — 15 px, mesurés — et
> les peint de sa propre teinte claire, `#F6F6F6` sur l'appareil observé, sans
> tenir compte de la couleur demandée. Le réglage ci-dessus vaut pour les autres
> cas : navigation à trois boutons, et versions d'Android antérieures à
> l'imposition du plein écran.
>
> **C'est la raison pour laquelle la barre d'onglets est blanche.** Puisque ces
> pixels échappent à l'application, la seule façon de faire disparaître la
> couture est de les rejoindre plutôt que de buter dessus. L'écart entre notre
> blanc et le sien vaut 1,08 de contraste : invisible.
>
> L'application réserve tout de même la place (`env(safe-area-inset-bottom)` sur
> `.tabbar`). Chrome branche le vrai plein écran pour les applications
> installées — modifications déposées en juillet 2026, pas encore livrées ; le
> jour où elles le seront, cette zone deviendra celle de la page sans rien
> changer ici.

## Fabriquer le fichier `.aab`

Google n'accepte que des fichiers `.aab` (_Android App Bundle_).

### Chemin A — le dépôt le fabrique lui-même (recommandé)

Le workflow **« Application Android (.aab) »** s'en charge, sur les serveurs de
GitHub, en moins de deux minutes. Rien à installer.

1. Onglet **Actions** du dépôt → **Application Android (.aab)** → **Run
   workflow**.
2. Laisser les deux champs vides pour un premier essai.
3. À la fin, télécharger l'archive déposée au bas de la page d'exécution.

**Sans clé de signature, le paquet produit n'est pas signé** : il prouve que la
fabrication aboutit, mais Google le refusera. Pour obtenir un paquet
publiable, ajouter ces quatre secrets dans **Réglages → Secrets and variables →
Actions** :

| Secret | Contenu |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | le magasin de clés encodé en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | son mot de passe |
| `ANDROID_KEY_PASSWORD` | le mot de passe de la clé |
| `ANDROID_KEY_ALIAS` | le nom de la clé dans le magasin |

Le magasin se crée une fois pour toutes, avec `keytool`, livré avec le JDK. Si
la commande n'est pas reconnue, installer un JDK — Temurin, sur
<https://adoptium.net>, en veillant à cocher l'ajout au PATH.

À la question « Est-ce correct ? », répondre **oui** : la réponse par défaut est
« non », et l'on recommence sans comprendre pourquoi. À la demande d'un mot de
passe pour la clé, appuyer sur Entrée pour reprendre celui du magasin — les
deux secrets à créer ensuite auront alors la même valeur.

**Windows (PowerShell)** — en une seule ligne : la barre oblique inverse de fin
de ligne n'y coupe pas les commandes.

```powershell
keytool -genkeypair -v -keystore upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Puis l'encodage en base64. Le passage par un fichier plutôt que par le
presse-papier n'est pas un détail : on **voit** alors ce que l'on copie. Un
presse-papier est invisible, il se fait écraser par la copie suivante, et l'on
finit par déposer dans le secret la commande au lieu de son résultat — c'est
arrivé.

```powershell
[IO.File]::WriteAllText("$PWD\cle-base64.txt", [Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\upload.keystore")), [Text.Encoding]::ASCII)
notepad cle-base64.txt
```

Le Bloc-notes doit afficher **une seule longue ligne de lettres et de chiffres,
commençant par `MII`**, de quelques milliers de caractères. C'est elle, et elle
seule, qui va dans `ANDROID_KEYSTORE_BASE64` : Ctrl+A, Ctrl+C.

Puis supprimer le fichier, aussi sensible que le magasin lui-même :

```powershell
Remove-Item cle-base64.txt
```

**macOS ou Linux**

```sh
keytool -genkeypair -v -keystore upload.keystore -alias upload \
        -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.keystore    # à coller dans ANDROID_KEYSTORE_BASE64
```

**Conserver ce fichier et son mot de passe hors de l'ordinateur** (gestionnaire
de mots de passe, sauvegarde). Ne jamais les déposer dans le dépôt :
`.gitignore` les refuse déjà, mais la vraie protection est de ne pas les y
mettre.

Le code de version suit le numéro d'exécution du workflow. Il doit dépasser
celui de tout envoi précédent — le champ **versionCode** permet de le forcer.

### Chemin B — PWABuilder, dans le navigateur

Utile si l'on préfère une interface graphique, ou pour obtenir un magasin de
clés sans ligne de commande — PWABuilder en génère un.

1. Ouvrir <https://www.pwabuilder.com> et saisir `https://rapidmusic.fr`.
2. Choisir l'empaquetage **Android**, puis les options du tableau ci-dessus —
   surtout l'identifiant `fr.rapidmusic.app`.
3. Télécharger l'archive. Elle contient :
   - le fichier `.aab` à envoyer à Google ;
   - un **magasin de clés** (`signing.keystore`) et son mot de passe ;
   - un `assetlinks.json` déjà rempli.
4. **Mettre le magasin de clés et son mot de passe à l'abri** (gestionnaire de
   mots de passe, sauvegarde hors de l'ordinateur). Ne jamais les déposer dans
   ce dépôt : `.gitignore` les refuse déjà, mais la vraie protection est de ne
   pas les y mettre.

L'interface du site peut avoir changé de formulation ; les réglages, eux, sont
ceux du tableau.

### Chemin C — Bubblewrap en local

Demande Node, un JDK et le SDK Android (environ 1 Go de téléchargement).

```sh
npm install -g @bubblewrap/cli
cd android          # twa-manifest.json y est déjà, avec tous les réglages
bubblewrap build    # crée la clé de signature au premier appel
```

> Le chemin A fait exactement cela, sur un serveur où le SDK est déjà installé.
> C'est aussi la raison pour laquelle la fabrication n'a pas lieu dans
> l'environnement de développement : `dl.google.com` y est bloqué, et c'est la
> seule source du SDK Android comme des versions actuelles du plugin Gradle
> Android — Maven Central s'arrête à la 2.3.0, de 2017.

## L'icône sous l'écran d'accueil

Elle vient de `public/icon-maskable-512.png`, et **pas** du site : elle est
recopiée dans le paquet Android. Changer le fichier ne suffit donc pas — il faut
refabriquer un `.aab` (ou un `.apk`) et réinstaller. C'est la seule chose de
l'application qui ne se met pas à jour toute seule.

Le fichier n'est pas retouché à la main : il est produit par

```sh
node scripts/icones.mjs          # icon-192, icon-512, apple-touch, App Store
node scripts/icone-maskable.mjs  # l'icône adaptative d'Android
```

Les couleurs et les proportions sont des constantes en tête de ce script, avec
la raison de chacune. Les règles ci-dessous y sont calculées puis vérifiées sur
l'image produite, plutôt que réappliquées de mémoire.

La proportion du dessin n'est pas libre. Le gabarit d'une icône adaptative
mesure 108 dp, Bubblewrap y pose l'image avec 8,5 dp de marge — soit 91 dp — et
le lanceur n'affiche que les **72 dp centraux**, découpés en cercle ou en
squircle selon le téléphone. La part visible du fichier vaut donc 72/91, environ
**79 %** de sa largeur : tout ce qui dépasse est perdu, et un dessin calculé
pour les 66,7 % habituels serait trop petit.

Le logo occupe aujourd'hui **55 % du disque visible** — il en occupait 66 %, ce
qui le faisait toucher le bord. Le dessin est centré sur son tracé réel, non sur
son cadre : le glyphe de `favicon.svg` n'est pas centré dans son repère de 24
unités, et s'y fier plaçait le logo 10 px trop haut.

Le fond est le dégradé de la marque, de `#8b5cf6` à `#d946ef`. Le violet de
départ est exactement celui de `--brand-gradient` dans `src/styles/main.css`,
pour qu'un seul violet circule ; l'arrivée est en fuchsia et non en rose, ce qui
fait lire le fond nettement plus violet sans l'aplatir.

Ce dégradé est **calculé pixel par pixel**, et non confié au rasteriseur : celui-ci
le trame, d'un écart de ±1 par canal. Invisible à l'œil, mais la compression ne
peut plus exploiter la régularité du dégradé et le fichier grossit de près de
40 %.

Le fichier est en RVB sans couche alpha — une icône maskable est opaque par
construction — ce qui le laisse à 12 Ko. Les cinq filtres du format PNG ont été
mesurés sur cette image : tous l'alourdissent, de 4 % pour le meilleur à 27 %
pour le pire. Un dégradé lisse se comprime déjà bien sans eux.

## L'étape qu'il ne faut pas rater : `assetlinks.json`

Sans elle, l'application s'ouvre **avec une barre d'adresse en haut** : elle a
l'air d'un navigateur déguisé, et Google peut refuser la fiche. C'est la cause
numéro un des rejets pour ce type d'application.

Le fichier est déjà servi, à la bonne adresse :
<https://rapidmusic.fr/.well-known/assetlinks.json>.

Il porte l'empreinte de **la clé d'envoi**, ce qui suffit à vérifier un paquet
installé à la main, hors Play Store — de quoi essayer l'application sur un vrai
téléphone avant toute publication. Il manque encore celle de Google, sans
laquelle l'application installée **depuis le Store** afficherait une barre
d'adresse. Les deux se listent côte à côte.

**Quelle empreinte ?** Celle de la clé qui signe l'application **livrée aux
téléphones**. Comme la signature par Google Play est obligatoire pour toute
nouvelle application, Google resigne le paquet : l'empreinte à publier est donc
la sienne, pas celle du magasin de clés créé à l'étape précédente.

1. Envoyer le `.aab` dans la Play Console (un test interne suffit). **Avant cet
   envoi, l'empreinte n'existe pas** : Google ne crée sa clé qu'au premier
   téléversement.
2. Ouvrir la page de signature :

   **Protégé avec Play** (menu de gauche, l'icône bouclier) → carte
   **« Protection Play Store »** → **« Accéder à la signature d'application
   Play »**.

   Les certificats sont sur cette sous-page, pas sur la page d'accueil de
   « Protégé avec Play ». Et surtout, **pas dans le menu** : l'entrée
   « Intégrité des applis », sous « Tester et publier », affiche « Les paramètres
   d'intégrité de l'appli ont été déplacés » et renvoie à la page d'accueil, qui
   ne les contient pas non plus. On tourne en rond.

   L'adresse directe évite tout le parcours, en gardant ses deux numéros :

   ```
   https://play.google.com/console/u/0/developers/<compte>/app/<appli>/keymanagement
   ```

   Puis *Certificat de la clé de signature de l'application* → copier l'empreinte
   **SHA-256**. Attention à ne pas prendre celle du *certificat de la clé
   d'importation*, juste en dessous : c'est la nôtre, elle est déjà dans le
   fichier.
3. La coller dans `public/.well-known/assetlinks.json` :

```json
"sha256_cert_fingerprints": ["AB:CD:EF:…"]
```

4. Pousser sur `master` : le déploiement publie le fichier en une minute.
5. Vérifier : réinstaller l'application depuis le test fermé, l'ouvrir — plus
   aucune barre d'adresse.

On peut lister **plusieurs** empreintes. Ajouter aussi celle de la clé d'envoi
permet de vérifier un `.aab` installé à la main, hors Play Store.

## Ce qui reste ensuite

Ces étapes ne dépendent pas du code ; le détail figure dans la réponse
« chantiers avant le Play Store » de la session.

- compte développeur (25 $ une fois) et vérification d'identité ;
- **test fermé : 12 testeurs inscrits pendant 14 jours consécutifs** avant de
  pouvoir demander l'accès à la production — c'est le délai le plus long, à
  lancer tôt ;
- formulaire **« Sécurité des données »** : les réponses exactes sont dans
  [`securite-des-donnees.md`](securite-des-donnees.md), établies en relisant le
  code. Restent la classification du contenu et le public visé ;
- adresses des pages légales, déjà en ligne :
  - <https://rapidmusic.fr/#/confidentialite> (obligatoire) ;
  - <https://rapidmusic.fr/#/suppression-compte> (obligatoire dès qu'il y a des
    comptes) ;
  - <https://rapidmusic.fr/#/mentions-legales>, <https://rapidmusic.fr/#/conditions> ;
- fiche : icône 512×512 (`public/icon-512.png`), image de mise en avant
  1024×500 et captures d'écran — **déjà produites**, dans
  [`play-store/`](../play-store/), avec le script qui les refait quand
  l'interface change.

### Les textes de la fiche, à recopier dans la Console

Ils ne viennent pas du paquet : ce sont des champs de la Play Console, chacun
avec sa limite. À recopier tels quels.

**Titre** — 30 caractères, et il en fait exactement 30 :

```
RapidMusic - Carrière musicale
```

**Description courte** — 80 caractères, celle qui s'affiche sous le titre :

```
Concerts, sorties, contrats, contacts. Tout votre univers, au même endroit.
```

77 caractères. Elle ne reprend pas « gestion de carrière musicale », déjà dans
le titre juste au-dessus : mieux vaut employer ces caractères comptés à dire
autre chose.

**Description complète** — 4 000 caractères, aucune contrainte ici :

```
Gestion de carrière musicale : concerts, sorties, contrats, contacts.
Tout votre univers, au même endroit.
```

Le titre et les descriptions se modifient à tout moment dans la Console, même
après publication — contrairement à l'identifiant du paquet.

## Rappel sur l'abonnement

Vendre un abonnement dans l'application Android impose **Google Play Billing**
et sa commission. Le plus simple pour une première publication : garder la
version Android entièrement gratuite, sans aucune mention de paiement, et
vendre sur le site.
