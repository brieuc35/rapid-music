# L'application iOS

Android et iOS ne se ressemblent pas du tout ici.

Sur Android, le paquet est une **TWA** : il ouvre `rapidmusic.fr` en plein
écran, sans rien embarquer. Le site se met à jour, l'application suit.

Apple n'a pas d'équivalent. Il faut une vraie application, et **Capacitor** en
fabrique une autour du site : les fichiers sont embarqués dans le paquet, et
toute mise à jour du site demande un nouvel envoi à l'App Store.

## Ce qui est déjà fait dans le dépôt

- `capacitor.config.ts` — la configuration, commentée ;
- `ios/` — le projet Xcode, versionné (ses fichiers produits sont exclus) ;
- l'icône 1024 × 1024, aux règles d'Apple : opaque, sans coins arrondis
  (`scripts/icone-ios.mjs`) ;
- `Info.plist` réglé : français, portrait sur iPhone, arm64, conformité à
  l'exportation, et **les deux autorisations photo** — voir plus bas, c'est la
  correction la plus importante ;
- trois endroits de l'application se comportent autrement dans l'enveloppe
  (`src/utils/enveloppe-native.ts`).

## Les trois différences de comportement

**La marge sous l'encoche.** La barre d'état d'iOS est dessinée *par-dessus* la
page, elle ne la pousse pas : sans `env(safe-area-inset-top)`, le logo et le
menu passent sous l'heure et le réseau.

**Le bandeau de mise à jour.** « Une nouvelle version est prête » n'a aucun sens
ici : les fichiers sont embarqués et ne changent qu'au gré d'Apple. Le bouton
« Recharger » ne rechargerait rien. Le service worker n'est donc pas inscrit
dans l'enveloppe.

**L'abonnement.** Sur le site, la page invite à installer l'application Android
pour souscrire. Dans l'application de l'App Store, cette phrase serait absurde —
et surtout, orienter vers un paiement extérieur contrevient à la **règle 3.1.1**
d'Apple et fait refuser la fiche. L'enveloppe iOS annonce donc l'absence de
l'offre Pro, sans indiquer d'ailleurs.

> Les deux autorisations photo méritent une mention à part. Le champ d'import est
> un simple `<input type="file">`, mais dans une enveloppe native c'est le
> sélecteur d'iOS qui s'ouvre. Sans `NSPhotoLibraryUsageDescription` et
> `NSCameraUsageDescription`, iOS ne demande pas l'autorisation : **il termine
> l'application**. La panne se produirait au premier appui sur « Ajouter une
> photo », sur l'appareil de l'examinateur d'Apple comme sur ceux des artistes.

## Ce qu'il reste à faire, sur un Mac

Tout ce qui suit demande macOS : Xcode n'existe pas ailleurs.

### 1. Le compte développeur — 99 €/an

**Et ça se renouvelle**, contrairement aux 25 $ versés une fois à Google. En nom
propre, la vérification prend quelques jours ; au nom d'une société, il faut un
numéro **D-U-N-S**, qui peut demander plusieurs semaines.

### 2. Récupérer le projet et l'ouvrir

```sh
git pull
npm ci
npm run build && npx cap sync ios
npx cap open ios
```

**Les deux commandes de la troisième ligne vont ensemble.** `sync` recopie ce que
`build` a produit ; oublier `build` envoie à Apple la version précédente du site,
sans qu'aucune erreur ne le signale. À refaire à chaque changement du code.

### 3. Dans Xcode

- onglet **Signing & Capabilities** : choisir l'équipe de développement. Xcode
  crée le profil de signature tout seul ;
- vérifier que l'identifiant est `fr.rapidmusic.app` ;
- régler **Version** (1.0.0) et **Build** (1). Le numéro de build doit augmenter
  à chaque envoi, même pour la même version.

### 4. App Store Connect

Créer la fiche, puis remplir :

- **nom** (30 caractères) et **sous-titre** (30) ;
- **description**, **mots-clés**, **catégorie** ;
- l'adresse des règles de confidentialité :
  <https://rapidmusic.fr/#/confidentialite> ;
- la **classification d'âge** ;
- le questionnaire **App Privacy** — l'équivalent du « Sécurité des données » de
  Google. Les réponses de [`securite-des-donnees.md`](securite-des-donnees.md) se
  transposent presque telles quelles.

### 5. Les captures d'écran

**Les visuels du Play Store ne conviennent pas** : Apple impose ses propres
dimensions, et 1080 × 1920 sera refusé. Il faut du **1290 × 2796** (iPhone 6,9").

`scripts/fiche-play-store.mjs` sait les produire à ces dimensions — c'est une
adaptation des constantes, pas une réécriture.

### 6. TestFlight, puis la révision

Bien plus léger que Google : **pas de règle des 12 testeurs sur 14 jours**. On
envoie, on essaie, on soumet. Comptez 24 à 48 h par passage en révision.

## Le risque à connaître

**Règle 4.2, « fonctionnalité minimale ».** Apple refuse les applications qui ne
sont qu'un site web reconditionné. RapidMusic a des arguments — comptes,
fonctionnement hors connexion, usage quotidien, données propres à chacun — mais
un refus au premier envoi est fréquent et se règle par allers-retours avec un
examinateur.

C'est pour cette raison que `capacitor.config.ts` **n'utilise pas `server.url`**.
Capacitor sait charger un site distant au lieu d'embarquer les fichiers ; ce
serait plus commode, et c'est exactement ce qui déclenche la règle 4.2.

## Et le paiement ?

Il n'y en a pas sur iOS, et c'est un choix pour l'instant.

La facturation Google Play (voir [`facturation.md`](facturation.md)) ne
fonctionne évidemment pas ici. Apple impose son propre système d'achat intégré,
avec son code, son serveur de vérification et sa commission de 15 %. C'est un
chantier de l'ampleur de celui d'Android.

En attendant, l'application iOS n'offre que la formule gratuite, ce qui est
autorisé — à condition de ne renvoyer vers aucun paiement extérieur, ce que le
code respecte.
