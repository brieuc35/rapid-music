# L'abonnement payant

RapidMusic Pro se vend **dans les deux applications** : par la facturation
Google Play sur Android, par l'achat intégré d'Apple sur iPhone. Le site ne
propose pas d'achat — sur un ordinateur, l'écran d'abonnement l'explique au lieu
d'afficher un bouton qui ne mènerait nulle part.

Les deux magasins prélèvent leur commission, et chacun impose son chemin.
Renvoyer d'une application vers l'autre est exclu : indiquer un paiement
extérieur dans l'application de l'App Store contrevient à la règle 3.1.1
d'Apple et fait refuser la fiche.

## Comment ça tient debout

Le navigateur **ne peut pas** s'ouvrir l'accès payant. `abonnements/{uid}` est
en `allow write: if false` pour tout le monde, sans exception (voir
`firestore.rules`). Un achat suit donc ce chemin :

```
  l'application     →  le magasin       : paiement, puis un jeton d'achat
  l'application     →  verifierAchat    : « voici mon jeton, et mon magasin »
  verifierAchat     →  le magasin       : « que vaut ce jeton ? »
  verifierAchat     →  abonnements/{uid}: écrit, avec les droits d'administration
```

Tout ce qui se passe dans le navigateur est contournable par qui sait ouvrir une
console. Seule la dernière étape fait foi.

Le magasin voyage avec le jeton parce que les deux reçus ne se vérifient pas au
même endroit et que rien dans leur forme ne permet de les distinguer à coup sûr.
Le champ est **facultatif**, et vaut Play s'il manque : les applications Android
déjà installées ne l'envoient pas, et l'exiger aurait coupé l'abonnement de tous
les abonnés en place au premier déploiement.

### Les deux moitiés, fichier par fichier

| | Android | iPhone |
| --- | --- | --- |
| Achat, côté application | `src/utils/facturation-play.ts` | `src/utils/facturation-apple.ts` + `ios/.../AchatPro.swift` |
| Choix du magasin | `src/utils/facturation.ts` | idem |
| Appel au magasin, côté serveur | `functions/src/play.ts` | `functions/src/apple.ts` |
| Ce que la réponse veut dire | `functions/src/facturation.ts` | `functions/src/facturation-apple.ts` |

Les deux derniers ne touchent ni au réseau ni à Firestore : c'est ce qui permet
de les éprouver par des tests, y compris sur les cas qu'on ne sait pas
provoquer — un remboursement, un prélèvement en échec, un abonnement suspendu.

### À qui appartient un achat

Google sait rattacher un achat à un identifiant de compte — mais seulement si
l'application le lui donne au moment de l'achat, et **le pont de facturation des
TWA ne transmet pas ce champ** : il n'accepte que `sku`, `oldSku`,
`purchaseToken` et le mode de remplacement. La réponse de Google ne dira donc
jamais à quel artiste l'achat appartient.

Sans rien de plus, un même jeton ouvrirait autant de comptes qu'on voudrait : il
suffirait de le faire circuler pour partager un abonnement à plusieurs.

D'où la collection `jetons` : **le premier compte qui présente un jeton se
l'approprie**, et lui seul pourra s'en servir ensuite. Le propriétaire légitime
revendique le sien à la seconde de l'achat ; personne n'a le temps de le
devancer. La revendication est prise dans une transaction, sans quoi deux appels
simultanés passeraient tous les deux.

Elle est relâchée à la suppression du compte. Sans cela, quelqu'un qui supprime
son compte puis en recrée un se verrait refuser **son propre abonnement**,
revendiqué pour toujours par un compte disparu.

### Le renouvellement

L'application revérifie son abonnement **à chaque lancement**, avec le jeton
qu'elle retrouve auprès du Play Store. C'est ce qui prolonge l'échéance au
renouvellement, et ce qui referme l'accès après un remboursement ou une
résiliation.

Google propose des avis en temps réel (Pub/Sub) pour la même chose. La
revérification au lancement s'en passe et suffit : le seul moment où l'état de
l'abonnement compte est celui où l'artiste ouvre l'application, c'est-à-dire
exactement celui où on le rafraîchit. Un abonné qui n'ouvre pas l'application ne
subit rien.

## Ce qu'il faut régler côté Google, une fois

Rien de ce qui précède ne fonctionne sans ces quatre étapes. Elles se font dans
les consoles, pas dans le code.

### 1. Créer les deux produits dans la Play Console

**Monétiser avec Play → Produits → Abonnements → Créer un abonnement**, deux
fois.

| ID du produit | Nom | Période | Prix |
| --- | --- | --- | --- |
| `pro_mensuel` | RapidMusic Pro — au mois | mensuelle | 9,99 € |
| `pro_annuel` | RapidMusic Pro — à l'année | annuelle | 99 € |

Les identifiants doivent être **exactement** ceux-ci : ce sont ceux que demande
le navigateur (`src/utils/facturation-play.ts`) et que vérifie le serveur
(`functions/src/facturation.ts`). Une faute de frappe ne se verrait pas à la
vérification, elle ferait échouer l'achat.

> **Deux produits, et non deux formules d'un même produit.** Ce n'est pas une
> préférence, c'est une contrainte du pont de facturation des TWA : il prend
> toujours la **première** offre du produit demandé
> (`offerDetails.get(0)`). Réunies sous un seul produit, les deux formules
> seraient indiscernables depuis le navigateur — l'artiste croirait choisir
> l'annuel et paierait ce que Google aurait mis en tête de liste.

Un **essai gratuit** se règle dans les offres de chaque abonnement. C'est le
remplaçant de l'ancienne démonstration locale, retirée en même temps que ce
travail : garder un bouton qui offrait Pro d'un clic aurait vidé la facturation
de son sens.

> ⚖️ **À vérifier sur un vrai téléphone.** Le pont prenant toujours la première
> offre, rien ne garantit que ce soit celle de l'essai gratuit plutôt que le
> tarif normal — l'ordre n'est pas documenté. Si l'essai ne s'applique pas,
> c'est là qu'il faudra regarder.

### Les prix ne sont pas dans le code

L'application demande les montants au Play Store (`lireTarifs`) et affiche ceux
de la Console, dans la devise du téléphone. Changer un prix là-bas suffit.

Les montants de `src/store/index.ts` (`PRO_PRICE`, `PRO_PRICE_ANNUEL`) ne
servent qu'à présenter l'offre **là où l'on ne peut pas acheter** : sur le site,
sur un ordinateur, sur un iPhone. Les garder à jour reste utile pour les
visiteurs, mais s'ils divergent de la Console, personne ne paiera le mauvais
prix.

### 2. Inviter le compte de service dans la Play Console

C'est l'étape qu'on oublie, et elle ne se devine pas : sans elle, l'API répond
**401 quels que soient les droits accordés côté Google Cloud**.

**Play Console → Utilisateurs et autorisations → Inviter un utilisateur**, avec
l'adresse du compte de service :

```
courriels@rapidmusic-db075.iam.gserviceaccount.com
```

Autorisation nécessaire : **Afficher les informations financières** sur
l'application RapidMusic. Rien de plus.

> Le compte s'appelle « courriels » parce qu'il a été créé pour l'envoi des
> messages automatiques. Il sert aussi ici, pour ne pas multiplier les identités
> à gérer.

### 3. Activer l'API Google Play Developer

**Console Google Cloud → APIs et services → Bibliothèque →** *Google Play
Android Developer API* → **Activer**, sur le projet `rapidmusic-db075`.

### Deux réglages Android que la facturation impose

Aucun des deux n'est un choix : sans eux, le paquet **ne se fabrique pas**. Les
deux ont été découverts en lisant les journaux d'une fabrication en échec, pas
dans une documentation.

**`minSdkVersion` passe de 21 à 23.** La bibliothèque de facturation le réclame,
et le fusionneur de manifestes s'arrête net :

```
Manifest merger failed : uses-sdk:minSdkVersion 21 cannot be smaller than
version 23 declared in library [com.google.androidbrowserhelper:billing:1.2.0]
```

Android propose bien de passer outre (`tools:overrideLibrary`), au prix de
pannes à l'exécution sur les appareils concernés : autant les écarter
proprement. Concrètement, l'application n'est plus installable sur Android 5.0
et 5.1 — moins de 1 % des appareils en service, et aucun ne recevra jamais de
mise à jour de sécurité.

### Les notifications viennent avec

`enableNotifications` est passé à `true` dans `android/twa-manifest.json`, et ce
n'est pas un choix : Bubblewrap **refuse de construire le paquet** avec la
facturation activée tant qu'elle est à `false` — « Play Billing requires
enableNotifications to be true ». La fabrication échoue avant même de commencer.

Concrètement, le paquet déclare l'autorisation de notification et le service qui
va avec. L'application n'envoie aucune notification et n'en demandera donc
jamais l'autorisation à l'artiste : aucune fenêtre ne s'ouvrira. Mais
l'autorisation apparaîtra dans la liste des permissions de la fiche Play Store.

### 4. Refabriquer et renvoyer le paquet

L'activation de la facturation change le paquet Android : elle ajoute la
bibliothèque de Google et deux composants au manifeste. Le `.aab` déjà envoyé
n'en sait rien.

1. Onglet **Actions** du dépôt → **Application Android (.aab)** → **Run
   workflow**, en augmentant le numéro de version ;
2. téléverser le résultat en test interne.

## Vérifier l'achat sur Android

Sur un vrai téléphone, avec l'application installée depuis le Play Store — rien
de tout cela ne fonctionne ailleurs.

Déclarez-vous **testeur de licence** (Play Console → Paramètres → Tests de
licence) : vos achats seront réels du point de vue de l'application, sans être
débités.

Ce qui doit se produire :

1. l'écran d'abonnement affiche **« Passer à Pro »** et les deux formules avec
   leurs prix — s'il affiche « Depuis l'application Android », c'est que le
   paquet n'a pas été refabriqué ; si les prix sont ceux du code et non ceux de
   la Console, c'est que `getDetails` n'a pas répondu ;
2. la fenêtre de paiement Google s'ouvre au prix réglé dans la Console, **et sur
   la bonne formule** — c'est le point à vérifier deux fois, une pour chaque ;
3. après paiement, les onglets Revenus et Contrats s'ouvrent ;
4. dans Firestore, `abonnements/{uid}` porte `plan: "pro"` et une échéance ;
5. un courriel de confirmation part — le déclencheur `abonnementPro` existait
   déjà, il se réveille désormais sur un vrai encaissement.

En cas d'échec, les journaux des fonctions disent lequel des quatre réglages
manque : `functions.logger` y écrit le code renvoyé par Google.

## Ce qu'il faut régler côté Apple

Quatre choses, dans cet ordre. Rien ne fonctionne tant que les quatre ne sont
pas faites, et les symptômes se ressemblent.

### 1. Créer les deux abonnements dans App Store Connect

**Votre app → Monétisation → Abonnements.** Il faut d'abord créer un **groupe
d'abonnements** — appelez-le « RapidMusic Pro » — puis les deux produits
dedans :

| Identifiant | Durée |
| --- | --- |
| `pro_mensuel` | 1 mois |
| `pro_annuel` | 1 an |

**Les identifiants doivent être exactement ceux-là.** Ce sont les mêmes que côté
Google, et ils sont écrits dans trois fichiers : `facturation.ts` côté serveur,
`facturation-play.ts` côté application, et `AchatPro.swift`. Une faute de frappe
ne se verrait pas à la vérification — elle ferait échouer l'achat lui-même.

Les deux dans **le même groupe** : c'est ce qui permet de passer du mensuel à
l'annuel sans repayer, et Apple s'occupe du prorata.

Chaque abonnement réclame un prix, une durée, un nom affiché, une description,
et **une capture d'écran de l'écran d'abonnement** pour l'examen.

### 2. Créer la clef d'API

**App Store Connect → Utilisateurs et accès → Intégrations → Clés.** Créez une
clef avec le rôle **In-App Purchase**.

Le fichier `.p8` ne se télécharge **qu'une seule fois**. Apple ne le redonne
jamais. Perdu, il faut révoquer la clef et recommencer.

Notez aussi l'**ID de la clef** et l'**ID de l'émetteur**, affichés sur la même
page.

### 3. Déposer les trois secrets

C'est une clef privée : elle signe les requêtes au nom de l'éditeur, et qui
l'a peut lire l'état des abonnements de tous les clients. **Elle n'entre pas
dans le dépôt.**

```sh
firebase functions:secrets:set APPLE_CLE < AuthKey_XXXXXXXXXX.p8
firebase functions:secrets:set APPLE_ID_CLE
firebase functions:secrets:set APPLE_ID_EDITEUR
firebase deploy --only functions
```

Le premier prend le contenu entier du fichier, en-têtes `BEGIN PRIVATE KEY`
comprises.

### 4. Refabriquer l'application iPhone

Le greffon d'achat est du code natif : il n'arrive pas par une mise à jour du
site. Il faut reconstruire et renvoyer le paquet.

```sh
npm run build && npx cap sync ios
npx cap open ios
```

Puis **Product → Archive → Distribute App**. Le numéro de build doit augmenter.

## Vérifier l'achat sur iPhone

Sur un vrai iPhone, avec un **compte de bac à sable** (App Store Connect →
Utilisateurs et accès → Sandbox). Les achats y sont réels du point de vue de
l'application, sans être débités, et les durées y sont accélérées — un mois dure
quelques minutes, ce qui permet de voir un renouvellement pour de bon.

Ce qui doit se produire :

1. l'écran d'abonnement affiche **« Passer à Pro »** et les prix venus de
   l'App Store — s'il affiche « Indisponible pour le moment », c'est que le
   greffon natif n'a pas été trouvé, donc que le paquet n'a pas été refabriqué ;
2. la fenêtre d'Apple s'ouvre **sur la bonne formule** ;
3. après paiement, les onglets Revenus et Contrats s'ouvrent ;
4. dans Firestore, `abonnements/{uid}` porte `plan: "pro"` et une échéance ;
5. en réinstallant l'application, l'abonnement **revient tout seul** au
   lancement — c'est la « restauration des achats » qu'Apple exige, et dont
   l'absence vaut un refus à l'examen.

Le bac à sable n'est pas qu'un confort : **les examinateurs d'Apple achètent
dedans**. `lireAbonnement` interroge donc la production puis le bac à sable, et
sans ce second essai l'abonnement échouerait pendant l'examen — alors qu'en
production tout marcherait.

## Ce qui reste possible plus tard

- **Vérifier la signature du reçu Apple en local**, avec `SignedDataVerifier`
  de la bibliothèque d'Apple. Cela prouverait que le reçu vient bien d'Apple,
  pour cette application, avant même de l'interroger. Il faut embarquer les
  certificats racine d'Apple dans le dépôt, qui se téléchargent sur
  `apple.com/certificateauthority`. Ce n'est pas ce qui protège l'accès
  aujourd'hui — l'appel authentifié à Apple s'en charge, et la revendication
  empêche qu'un achat serve deux fois.
- **Les avis en temps réel** des deux magasins, si la revérification au
  lancement se révélait insuffisante.

