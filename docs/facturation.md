# L'abonnement payant

RapidMusic Pro se vend **dans l'application Android**, par la facturation
Google Play. Le site ne propose pas d'achat : sur un ordinateur ou un iPhone,
l'écran d'abonnement l'explique au lieu d'afficher un bouton qui ne mènerait
nulle part.

C'est un choix, avec ses conséquences : Google prélève 15 %, et personne d'autre
qu'un utilisateur Android ne peut souscrire.

## Comment ça tient debout

Le navigateur **ne peut pas** s'ouvrir l'accès payant. `abonnements/{uid}` est
en `allow write: if false` pour tout le monde, sans exception (voir
`firestore.rules`). Un achat suit donc ce chemin :

```
  l'application     →  Google Play      : paiement, puis un jeton d'achat
  l'application     →  verifierAchat    : « voici mon jeton »
  verifierAchat     →  Google Play      : « que vaut ce jeton ? »
  verifierAchat     →  abonnements/{uid}: écrit, avec les droits d'administration
```

Tout ce qui se passe dans le navigateur est contournable par qui sait ouvrir une
console. Seule la dernière étape fait foi.

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

## Ce qu'il faut régler, une fois

Rien de ce qui précède ne fonctionne sans ces quatre étapes. Elles se font dans
les consoles, pas dans le code.

### 1. Créer le produit dans la Play Console

**Monétiser avec Play → Produits → Abonnements → Créer un abonnement.**

| Champ | Valeur |
| --- | --- |
| ID du produit | `pro_mensuel` |
| Nom | RapidMusic Pro |
| Période de facturation | mensuelle |
| Prix | 9,99 € |

L'identifiant doit être **exactement** `pro_mensuel` : c'est celui que
demande le navigateur (`src/utils/facturation-play.ts`) et celui que vérifie le
serveur (`functions/src/facturation.ts`). Une faute de frappe ne se verrait pas
à la vérification, elle ferait échouer l'achat.

Un **essai gratuit** se règle ici, dans les offres de l'abonnement. C'est le
remplaçant de l'ancienne démonstration locale, retirée en même temps que ce
travail : garder un bouton qui offrait Pro d'un clic aurait vidé la facturation
de son sens.

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

### 4. Refabriquer et renvoyer le paquet

L'activation de la facturation change le paquet Android : elle ajoute la
bibliothèque de Google et deux composants au manifeste. Le `.aab` déjà envoyé
n'en sait rien.

1. Onglet **Actions** du dépôt → **Application Android (.aab)** → **Run
   workflow**, en augmentant le numéro de version ;
2. téléverser le résultat en test interne.

## Vérifier que ça marche

Sur un vrai téléphone, avec l'application installée depuis le Play Store — rien
de tout cela ne fonctionne ailleurs.

Déclarez-vous **testeur de licence** (Play Console → Paramètres → Tests de
licence) : vos achats seront réels du point de vue de l'application, sans être
débités.

Ce qui doit se produire :

1. l'écran d'abonnement affiche **« Passer à Pro »** — s'il affiche « Depuis
   l'application Android », c'est que le paquet n'a pas été refabriqué ;
2. la fenêtre de paiement Google s'ouvre au prix réglé dans la Console ;
3. après paiement, les onglets Revenus et Contrats s'ouvrent ;
4. dans Firestore, `abonnements/{uid}` porte `plan: "pro"` et une échéance ;
5. un courriel de confirmation part — le déclencheur `abonnementPro` existait
   déjà, il se réveille désormais sur un vrai encaissement.

En cas d'échec, les journaux des fonctions disent lequel des quatre réglages
manque : `functions.logger` y écrit le code renvoyé par Google.

## Ce qui reste possible plus tard

- **Vendre aussi sur le site**, avec Stripe, pour les iPhone et les ordinateurs.
  Google ne l'interdit pas : ce qu'il impose, c'est que l'achat **fait dans
  l'application** passe par lui. La seule règle est de ne pas pousser depuis
  l'application vers le paiement du site.
- **Les avis en temps réel** de Google, si la revérification au lancement se
  révélait insuffisante.
