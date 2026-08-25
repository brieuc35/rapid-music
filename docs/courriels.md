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
                     ├─→  fonction serveur  ─→  SMTP  ─→  Brevo  ─→  artiste
abonnement → pro    ─┘       (functions/)                   │
                                                            └→  trace dans « courriels »
```

Les fonctions envoient elles-mêmes, en SMTP direct.

> **Pourquoi pas l'extension « Trigger Email »**, qui était le chemin naturel :
> les extensions Firebase s'arrêtent le **31 mars 2027**, et surtout leurs
> réglages deviennent immodifiables à cette date. Impossible d'y renouveler une
> clé qui aurait fuité. Cloud Functions, lui, n'est pas concerné par cet arrêt.

Les identifiants d'envoi sont dans **Secret Manager** de Google Cloud : ni dans
ce dépôt, ni dans le code déployé, et modifiables à tout moment sans redéployer.

Rien dans le code n'est propre à Brevo. Changer de service se fait en changeant
les secrets.

## Un seul message à l'inscription

Firebase sait envoyer sa propre demande de confirmation d'adresse, et `signUp()`
l'a fait pendant la mise en service — le temps de vérifier que le message
d'accueil arrivait vraiment. Cet envoi a été retiré depuis.

Deux raisons, dont la seconde n'était pas prévue :

- deux courriels pour un seul évènement font mauvais effet et invitent à n'en
  lire aucun ;
- surtout, les deux demandes partaient **pour la même adresse à une seconde
  d'intervalle**, et la protection anti-abus de Firebase refusait la seconde —
  celle du serveur — avec `TOO_MANY_ATTEMPTS_TRY_LATER`. Le message d'accueil
  arrivait donc sans son bouton de confirmation, et le premier essai réel l'a
  montré.

Le filet reste en place si le lien manque malgré tout : le message d'accueil
renvoie alors au bandeau de l'application, qui sait redemander la confirmation
(`resendVerification()`), et l'application demeure utilisable sans adresse
confirmée.

## Ce qu'il reste à faire — dans la console, une fois

### 1. Le service d'envoi

Il faut une adresse d'expédition et un accès SMTP. Trois offres gratuites
suffisantes ici :

| Service | Gratuit | Remarque |
| --- | --- | --- |
| **Brevo** | 300 messages/jour | français, interface en français |
| Resend | 3 000 messages/mois | très simple, en anglais |
| Mailjet | 200 messages/jour | français |

Le volume attendu est de deux messages par artiste : n'importe laquelle convient
largement.

**Faire vérifier le domaine `rapidmusic.fr`** dans le service choisi. Sans cela,
les messages partent d'une adresse qui n'est pas la vôtre et finissent en
indésirables. Chez Brevo : *Expéditeurs, domaines et IP dédiées* → onglet
*Domaines*. Le service donne des lignes à créer dans la zone DNS du domaine ;
certaines sont des `TXT`, d'autres des `CNAME`.

> Piège de l'éditeur de zone : le champ « sous-domaine » ne prend que la partie
> de gauche. Pour `mail._domainkey.rapidmusic.fr`, on saisit `mail._domainkey`,
> et le domaine est ajouté automatiquement. Pour une ligne sur le domaine
> lui-même, on laisse le champ vide.

Puis récupérer la **clé SMTP** : chez Brevo, *SMTP & API* → onglet *SMTP* →
« Générer une nouvelle clé SMTP ». Lui donner un nom qui dit à quoi elle sert
(`firebase`), pour pouvoir la révoquer seule plus tard. **Elle ne se réaffiche
pas** : la copier tout de suite dans un gestionnaire de mots de passe.

> La clé SMTP est un mot de passe. Elle ne va **jamais** dans les DNS, qui sont
> publics — à ne pas confondre avec la clé DKIM, qui elle est publique par
> nature.

### 2. Les trois secrets

Console Google Cloud → **Secret Manager** → *Créer un secret*, trois fois. Les
noms doivent être **exactement** ceux-ci :

| Nom du secret | Valeur | Exemple |
| --- | --- | --- |
| `SMTP_HOTE` | serveur, port optionnel après deux-points | `smtp-relay.brevo.com` |
| `SMTP_IDENTIFIANT` | identifiant de connexion | affiché sur la page SMTP |
| `SMTP_CLE` | la clé SMTP | `xsmtpsib-…` |

Sans port, le 465 est utilisé, chiffré d'emblée. Pour le 587, écrire
`smtp-relay.brevo.com:587` : le chiffrement s'y négocie après connexion, et le
code s'adapte au port.

Ces trois valeurs se modifient plus tard sans toucher au code : Secret Manager
crée une nouvelle version, et le prochain démarrage la prend.

### 3. Le compte sous lequel les fonctions s'exécutent

Console Google Cloud → **Comptes de service** → *Créer un compte de service*.

| Champ | Valeur |
| --- | --- |
| Identifiant | `courriels` |
| Rôles | **Utilisateur Cloud Datastore** et **Administrateur Firebase Authentication** |

L'adresse obtenue — `courriels@rapidmusic-db075.iam.gserviceaccount.com` — est
celle inscrite dans `functions/src/index.ts`. Les deux doivent correspondre.

**Pourquoi ce compte plutôt que celui par défaut.** Firebase utilise sinon le
compte d'App Engine, que les projets récents ne créent plus : le déploiement
échoue alors sur son absence, et le formulaire censé le créer réclame ce même
compte. Surtout, ce compte par défaut porte le rôle d'éditeur du projet — bien
plus que ce que deux fonctions d'envoi de courriels ont à faire.

Les deux rôles ci-dessus sont exactement ce dont elles ont besoin : lire un
compte pour connaître son adresse et fabriquer un lien de confirmation, et
écrire la trace de l'envoi. Le droit de lire les trois secrets est accordé
automatiquement par le déploiement.

### 4. La clé de déploiement

Console Google Cloud → **IAM et administration** → **Comptes de service** →
créer un compte, lui donner le rôle **Firebase Admin**, puis créer une **clé au
format JSON**.

Le fichier téléchargé va dans GitHub → **Réglages → Secrets and variables →
Actions** → nouveau secret nommé `FIREBASE_SERVICE_ACCOUNT`, contenant **le
fichier entier**, accolades comprises.

> Cette clé passe au-dessus des règles de sécurité. Elle n'a rien à faire dans
> le dépôt ni dans une page web — à ne pas confondre avec la configuration
> Firebase de `src/firebase.ts`, qui est publique par conception.

### 5. Déployer

Onglet **Actions** → **Courriels automatiques (déploiement)** → **Run
workflow**. Le workflow vérifie les types, lance les tests, puis déploie. Il
refuse de déployer si un test échoue.

> Si le déploiement se plaint de la version de Node, c'est le seul réglage à
> corriger : remplacer `"node": "22"` par `"node": "20"` dans
> `functions/package.json`. Les versions acceptées changent au fil du temps, et
> le message d'erreur indique lesquelles le sont.

> S'il se plaint de ne pas accéder aux secrets, donner le rôle **Secret Manager
> Secret Accessor** au compte de service utilisé par les fonctions, dans la
> console Google Cloud.

## Essayer, avant d'y croire

**Le message de bienvenue** — créer un compte avec une adresse à soi, depuis
<https://rapidmusic.fr>. Le message doit arriver en une minute, avec un bouton
« Confirmer mon adresse » qui fonctionne.

**Le message Pro** — dans la console Firestore, créer à la main le document
`abonnements/{identifiant du compte}` avec le champ `plan` valant `pro`. Le
message doit arriver. C'est exactement ce que fera le prestataire de paiement
plus tard.

**La preuve que la signature fonctionne** — ouvrir le message reçu dans Gmail,
puis *Afficher l'original*. La ligne `DKIM : 'PASS' avec le domaine
rapidmusic.fr` prouve d'un coup que la clé est publiée, correcte, et acceptée.

**Si rien n'arrive :** regarder la collection **`courriels`** dans Firestore.
Chaque envoi y laisse une ligne — `etat` vaut `envoye` ou `echec`, et le champ
`erreur` dit pourquoi. Si aucune ligne n'apparaît, le problème est en amont :
Console → Functions → Journaux.

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

Tout est dans `functions/src/courriels.ts`. Les tests vérifient ce qui doit le
rester : la présence du lien de confirmation, celle des mentions légales,
l'absence de feuille de style et d'image (les logiciels de messagerie
suppriment la première et bloquent la seconde), et le fait qu'un message ne part
jamais deux fois pour le même évènement.

```sh
cd functions && npm test
```

Après modification, relancer le workflow de déploiement : le texte des messages
vit dans les fonctions, pas sur le site — il ne suit donc pas un déploiement
ordinaire.
