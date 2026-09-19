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
- l'icône 1024 × 1024, aux règles d'Apple : opaque, sans coins arrondis. Elle
  est produite par `scripts/icones.mjs`, avec toutes les autres icônes carrées
  et à partir du même dessin (`scripts/marque.mjs`) ;
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

**L'abonnement.** Il se souscrit dans les deux applications, mais pas par le
même chemin : Google Play sur Android, l'achat intégré d'Apple sur iPhone. Sur
le site, il ne se souscrit pas, et la page invite à installer l'application.

Ce qui reste interdit, c'est de renvoyer d'un magasin vers l'autre : indiquer un
paiement extérieur dans l'application de l'App Store contrevient à la **règle
3.1.1** d'Apple et fait refuser la fiche. Le seul cas où l'enveloppe iOS
n'affiche pas de bouton — le greffon natif introuvable — annonce donc une
indisponibilité passagère, sans indiquer d'ailleurs.

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
- le questionnaire **Confidentialité de l'app** — l'équivalent du « Sécurité des
  données » de Google. Les réponses sont écrites case par case dans
  [`securite-des-donnees.md`](securite-des-donnees.md), section « Le
  questionnaire d'Apple ».

### 5. Les captures d'écran et l'aperçu

**Déjà produits**, dans [`app-store/`](../app-store/). Le mode d'emploi est dans
[`app-store/LISEZ-MOI.md`](../app-store/LISEZ-MOI.md).

| Quoi | Taille | Commande |
| --- | --- | --- |
| Six captures, en trois tailles | 1320 × 2868, 1290 × 2796 et 1284 × 2778 | `node scripts/fiche-play-store.mjs` |
| L'aperçu vidéo, 24 s | 886 × 1920 | `node scripts/apercu-app-store.mjs` |
| L'illustration promotionnelle | 4320 × 1080 | `node scripts/fiche-play-store.mjs` |

Les visuels du Play Store ne conviennent pas — Apple n'accepte que les
dimensions exactes d'un appareil, et 1080 × 1920 n'en est aucune. Trois tailles
de captures sont fournies parce que l'emplacement proposé dépend de la version
d'App Store Connect et des appareils que l'application déclare : rien ne
l'annonce avant l'envoi, et le formulaire a d'abord réclamé du 6,5 pouces.
**Envoyez celle que le message d'erreur nomme** ; Apple dérive les autres
tailles de la plus grande fournie.

**Le piège de cet écran** : les captures et l'aperçu se déposent au même
endroit, sous le même intitulé « Aperçus et captures d'écran », et n'ont pas la
même taille. Un aperçu en 1320 × 2868 est refusé ; il lui faut 886 × 1920, qui
couvre en revanche toute la gamme récente d'un seul fichier.

L'aperçu est facultatif. Il n'y a pas d'équivalent côté Google, qui ne prend
qu'un lien YouTube et aucun fichier.

**L'illustration promotionnelle ne se téléverse pas encore.** Son emplacement
n'apparaît dans App Store Connect que si l'équipe éditoriale d'Apple retient
l'application pour l'onglet Aujourd'hui. Le fichier est fabriqué d'avance, sans
texte — Apple l'interdit là et pose lui-même le nom de l'application
par-dessus.

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

**Il y en a un.** L'achat intégré d'Apple est en place : un greffon StoreKit 2
dans `ios/App/CapApp-SPM/Sources/CapApp-SPM/AchatPro.swift`, et la même fonction
serveur que pour Google, qui interroge cette fois l'App Store.

Tout est décrit dans [`facturation.md`](facturation.md) : les deux abonnements à
créer dans App Store Connect, la clef d'API à générer, les trois secrets à
déposer, et comment l'éprouver en bac à sable.

Deux points valent d'être connus avant l'examen :

- **la restauration des achats est obligatoire.** Elle est faite au lancement, à
  partir de `currentEntitlements` : quelqu'un qui réinstalle retrouve son
  abonnement sans repayer. Son absence vaut un refus ;
- **les examinateurs achètent en bac à sable.** Le serveur interroge donc la
  production puis le bac à sable ; sans ce second essai, l'abonnement échouerait
  pendant l'examen alors qu'en production tout marcherait.
