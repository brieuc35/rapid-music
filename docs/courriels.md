# Les deux courriels automatiques

RapidMusic envoie deux messages, et deux seulement :

| Quand | Message |
| --- | --- |
| Un compte est créé | Bienvenue, avec le lien de confirmation de l'adresse |
| `abonnements/{uid}` passe à `pro` | Confirmation que le compte Pro est actif |

Aucun autre envoi. Pas de lettre d'information : celle-là demanderait un
consentement préalable, ce que ces deux-ci ne demandent pas — ils accompagnent
une action de l'artiste, la loi les appelle des messages *transactionnels*.

## Comment ça marche

```
création de compte  ─┐
                     ├─→  fonction serveur  ─→  collection « mail »  ─→  extension  ─→  artiste
abonnement → pro    ─┘        (functions/)         (Firestore)         Trigger Email
```

Les fonctions **n'envoient pas** les messages : elles déposent un document dans
la collection `mail`, que l'extension officielle *Trigger Email from Firestore*
surveille. Deux raisons de ne pas ouvrir une connexion SMTP dans le code :

- l'identifiant d'envoi reste dans la configuration de l'extension, et
  n'apparaît donc jamais dans ce dépôt ;
- les échecs et les réessais sont écrits dans le document lui-même : un envoi
  manqué se voit, au lieu de disparaître dans un journal.

**La collection `mail` est fermée au navigateur** (`firestore.rules`). Ce n'est
pas une précaution de principe : y déposer un document, c'est envoyer un message
au nom de RapidMusic, à l'adresse que l'on veut et avec le contenu que l'on veut.

## Un seul message à l'inscription — la dernière étape

Firebase sait envoyer sa propre demande de confirmation d'adresse, et
`signUp()` l'utilise encore aujourd'hui. Elle arrive à la même seconde que le
message de bienvenue : deux courriels pour un seul évènement, ce qui fait mauvais
effet et invite à n'en lire aucun.

Le message de bienvenue porte déjà le lien de confirmation, **fabriqué par la
fonction serveur**. Il n'y a donc plus qu'à retirer l'envoi du navigateur, dans
`signUp()` (`src/store/index.ts`) — deux lignes.

**À faire en dernier, et pas avant.** Les retirer d'abord ouvrirait une période
— le temps de faire vérifier le domaine d'expédition, un jour ou deux — pendant
laquelle un nouveau compte ne recevrait *aucun* message, alors que le bandeau de
l'application affirmerait qu'un lien a été envoyé. Deux messages valent mieux que
zéro. L'ordre est donc :

1. les quatre étapes ci-dessous ;
2. essayer les deux messages pour de vrai ;
3. alors seulement, retirer l'envoi du navigateur.

Dans tous les cas le filet reste en place : le bandeau de l'application permet de
redemander le lien à tout moment (`resendVerification()`), et l'application reste
utilisable sans adresse confirmée.

## Ce qu'il reste à faire — dans la console, une fois

Ces quatre étapes ne peuvent pas être faites depuis le dépôt.

### 1. Choisir un service d'envoi

Il faut une adresse d'expédition et un accès SMTP. Trois offres gratuites
suffisantes ici :

| Service | Gratuit | Remarque |
| --- | --- | --- |
| **Brevo** | 300 messages/jour | français, interface en français |
| Resend | 3 000 messages/mois | très simple, en anglais |
| Mailjet | 200 messages/jour | français |

Le volume attendu est de deux messages par artiste : n'importe laquelle convient
largement.

**Faire vérifier le domaine `rapidmusic.fr`** dans le service choisi (il demande
d'ajouter deux ou trois lignes chez le fournisseur du domaine). Sans cela, les
messages partent d'une adresse qui n'est pas la vôtre et finissent en indésirables.
Adresse d'expédition conseillée : `bonjour@rapidmusic.fr`.

### 2. Installer l'extension Trigger Email

Console Firebase → **Extensions** → rechercher **Trigger Email from Firestore**
→ Installer. Réglages à donner :

| Réglage | Valeur |
| --- | --- |
| Collection surveillée | `mail` |
| Adresse d'expédition | `RapidMusic <bonjour@rapidmusic.fr>` |
| Adresse de réponse | `rapidmusic.rm@gmail.com` |
| Connexion SMTP | celle fournie par le service de l'étape 1 |
| Région | `europe-west1` |

La région importe : les fonctions sont déployées en Europe, autant que l'envoi le
soit aussi.

### 3. Créer la clé de déploiement

Console Google Cloud → **IAM et administration** → **Comptes de service** →
créer un compte, lui donner le rôle **Firebase Admin**, puis créer une **clé au
format JSON**.

Le fichier téléchargé va dans GitHub → **Réglages → Secrets and variables →
Actions** → nouveau secret nommé `FIREBASE_SERVICE_ACCOUNT`, contenant **le
fichier entier**, accolades comprises.

> Cette clé passe au-dessus des règles de sécurité. Elle n'a rien à faire dans
> le dépôt ni dans une page web — à ne pas confondre avec la configuration
> Firebase de `src/firebase.ts`, qui est publique par conception.

### 4. Déployer

Onglet **Actions** → **Courriels automatiques (déploiement)** → **Run
workflow**. Le workflow vérifie les types, lance les tests, puis déploie. Il
refuse de déployer si un test échoue.

> Si le déploiement se plaint de la version de Node, c'est le seul réglage à
> corriger : remplacer `"node": "22"` par `"node": "20"` dans
> `functions/package.json`. Les versions acceptées changent au fil du temps, et
> le message d'erreur indique lesquelles le sont.

## Essayer, avant d'y croire

Le mieux est de vérifier les deux chemins pour de vrai :

**Le message de bienvenue** — créer un compte avec une adresse à soi, depuis
<https://rapidmusic.fr>. Le message doit arriver en une minute, avec un bouton
« Confirmer mon adresse » qui fonctionne.

**Le message Pro** — dans la console Firestore, créer à la main le document
`abonnements/{identifiant du compte}` avec le champ `plan` valant `pro`. Le
message doit arriver. C'est exactement ce que fera le prestataire de paiement
plus tard.

**Si rien n'arrive :** regarder la collection `mail` dans Firestore. Chaque
document y reçoit un champ `delivery` qui dit où en est l'envoi, et pourquoi il a
échoué le cas échéant. Si le document n'existe pas du tout, le problème est dans
la fonction : Console → Functions → Journaux.

## Le second message et les paiements

Le déclencheur est l'écriture dans `abonnements/{uid}`, la seule information que
le navigateur ne peut pas se donner à lui-même. Cela veut dire deux choses.

Aujourd'hui, seule une écriture à la main dans la console déclenche le message —
ce qui est utile pour l'essayer.

Demain, quand les paiements seront branchés, **rien ne changera ici** : le
prestataire écrira ce document après encaissement vérifié, et le message partira.
Que ce soit Stripe sur le site ou Google Play sur Android n'a aucune importance
pour cette fonction.

À noter : le prestataire envoie **son propre reçu**, et c'est le seul qui fasse
foi comptablement. Le message de RapidMusic ne le remplace pas, il confirme que
le compte est bien passé en Pro — la question que se pose l'artiste après avoir
payé.

## Modifier le texte des messages

Tout est dans `functions/src/courriels.ts`, et les tests de
`functions/src/courriels.test.ts` vérifient ce qui doit le rester : la présence
du lien de confirmation, celle des mentions légales, l'absence de feuille de
style et d'image (les logiciels de messagerie suppriment la première et bloquent
la seconde), et le fait qu'un message ne part jamais deux fois pour le même
évènement.

```sh
cd functions && npm test
```

Après modification, relancer le workflow de déploiement : le texte des messages
vit dans les fonctions, pas sur le site — il ne suit donc pas un déploiement
ordinaire.
