# Le formulaire « Sécurité des données » de la Play Console

Réponses à recopier, établies en relisant le code — pas de mémoire. Chaque
réponse indique **d'où elle vient**, pour qu'elle puisse être revérifiée le jour
où l'application changera.

> Ce formulaire engage le compte développeur. Une déclaration fausse est un
> motif de retrait. Deux réponses relèvent d'un jugement plutôt que d'un fait :
> elles sont signalées par ⚖️ et expliquées.

## Ce que l'application collecte, en fait

Un seul endroit reçoit des données : **Firebase**, chez Google.

| Où | Quoi |
| --- | --- |
| Firebase Authentication | l'adresse e-mail, le mot de passe (jamais lisible), un identifiant de compte |
| Firestore `artistes/{compte}` | tout ce que l'artiste saisit : profil, concerts, sorties, contrats, contacts, tâches, agenda, revenus, label |
| Firestore `abonnements/{compte}` | la formule en cours. **Écriture interdite au navigateur** |
| Firestore `courriels` | la trace des deux messages automatiques : destinataire, objet, succès ou échec |

Et un seul en sort : **Brevo**, qui achemine les deux messages automatiques
(bienvenue, confirmation Pro). Il ne reçoit que l'adresse et le message.

**Ce qui n'existe pas**, vérifié dans le code : aucune mesure d'audience
(`firebase/analytics` n'est pas importé, et `src/firebase.ts` dit pourquoi),
aucune publicité, aucun rapport de plantage, aucun identifiant publicitaire,
aucune géolocalisation. L'import de relevés CSV est lu **dans le navigateur**
(`file.text()` dans `RoyaltiesView.vue`) : le fichier n'est jamais envoyé, seuls
les montants qu'il contient sont enregistrés.

## Les trois questions d'ouverture

| Question | Réponse | Pourquoi |
| --- | --- | --- |
| Votre application collecte-t-elle ou partage-t-elle des données utilisateur ? | **Oui** | un compte, un profil, des données de carrière |
| Toutes les données sont-elles chiffrées en transit ? | **Oui** | le site est en HTTPS, Firebase Auth et Firestore aussi, et l'envoi SMTP est chiffré (port 465 d'emblée, ou 587 négocié — voir `optionsSmtp`) |
| Proposez-vous un moyen de demander la suppression des données ? | **Oui** | mieux qu'une demande : la suppression se fait dans l'application, sous mot de passe (`deleteAccount`), et <https://rapidmusic.fr/#/suppression-compte> l'explique |

## « Partagées » : non, partout

Google exclut de la notion de partage les transferts vers un **prestataire qui
traite pour votre compte**. Firebase et Brevo sont exactement cela : ils
hébergent et acheminent, ils n'exploitent rien pour eux-mêmes.

Donc **« Partagées » = Non pour tous les types**, sans exception.

> À revoir le jour où un prestataire de paiement, une mesure d'audience ou un
> service d'intelligence artificielle entrera dans l'application. Ce jour-là,
> cette page est la première à rouvrir.

## Le détail, type par type

Pour chaque ligne cochée : **Collectées = Oui**, **Partagées = Non**,
**Traitées de façon éphémère = Non** (tout est conservé tant que le compte
existe). Reste à préciser l'obligation et la finalité.

### Informations personnelles

| Type | Collecté | Obligatoire ? | Finalités | D'où ça vient |
| --- | --- | --- | --- | --- |
| Nom | **Oui** | Obligatoire | Fonctionnalité de l'application, Gestion du compte | le nom de scène est exigé à l'inscription ; le nom réel est facultatif |
| Adresse e-mail | **Oui** | Obligatoire | Fonctionnalité, Gestion du compte | c'est l'identifiant de connexion, et l'adresse des deux messages automatiques |
| ID utilisateur | **Oui** | Obligatoire | Fonctionnalité, Gestion du compte | l'identifiant Firebase, qui nomme le document de l'artiste |
| Numéro de téléphone | **Oui** | Facultatif | Fonctionnalité | champ du profil, et numéros des contacts professionnels |
| Adresse postale | Non | — | — | seule une ville en texte libre existe, déclarée en « Autres informations » |
| Autres informations | **Oui** | Facultatif | Fonctionnalité | ville, biographie, liens Instagram / Spotify / site |
| Origine, opinions, orientation | Non | — | — | aucun champ de ce genre |

### Informations financières

| Type | Collecté | Obligatoire ? | Finalités |
| --- | --- | --- | --- |
| Informations de paiement | **Non** | — | aucun paiement dans l'application Android |
| Historique d'achats | **Non** | — | idem |
| Solvabilité | **Non** | — | — |
| Autres informations financières | **Oui** | Facultatif | Fonctionnalité |

« Autres informations financières » couvre les cachets de concerts, les montants
et taux des contrats, et les revenus de streaming. Ce sont les **revenus** de
l'artiste, pas des moyens de paiement — la distinction compte.

### Photos et vidéos

| Type | Collecté | Obligatoire ? | Finalités |
| --- | --- | --- | --- |
| Photos | **Oui** | Facultatif | Fonctionnalité |
| Vidéos | **Non** | — | — |

La photo de profil, réduite à 512 px et enregistrée avec le reste du compte.

### Contacts

| Type | Collecté | Obligatoire ? | Finalités |
| --- | --- | --- | --- |
| Contacts | **Oui** | Facultatif | Fonctionnalité |

⚖️ **Jugement.** L'application ne lit **jamais** le répertoire du téléphone —
aucune autorisation n'est demandée. Mais elle enregistre des fiches de contacts
professionnels que l'artiste saisit : nom, société, e-mail, téléphone. C'est
bien de l'information de contact stockée sur nos serveurs, donc déclarée.
Ne pas la déclarer sous prétexte qu'elle est tapée à la main serait risqué.

### Agenda

| Type | Collecté | Obligatoire ? | Finalités |
| --- | --- | --- | --- |
| Évènements d'agenda | **Oui** | Facultatif | Fonctionnalité |

⚖️ **Jugement.** Même raisonnement : l'agenda du téléphone n'est jamais lu, mais
l'application enregistre des évènements datés avec leurs notes. Un utilisateur
qui lit la fiche s'attend à voir cette ligne. En cas de doute, mieux vaut
déclarer que taire.

### Activité dans l'application

| Type | Collecté | Obligatoire ? | Finalités |
| --- | --- | --- | --- |
| Interactions | **Non** | — | aucune mesure d'audience |
| Historique de recherche | **Non** | — | la recherche filtre l'écran, rien n'est enregistré |
| Applications installées | **Non** | — | — |
| Autres contenus créés par l'utilisateur | **Oui** | Facultatif | Fonctionnalité |
| Autres actions | **Non** | — | — |

« Autres contenus » : concerts, sorties, contrats, tâches, fiche du label, et
toutes les notes libres.

### Tout le reste : Non

Position, Santé et remise en forme, Messages, Fichiers audio, Fichiers et
documents, Navigation web, Informations et performances de l'application
(y compris **rapports de plantage** et **diagnostics**), Identifiants
d'appareil ou autres.

Deux points valent d'être notés, parce qu'on pourrait croire le contraire :

- **Messages = Non.** L'application *envoie* deux messages, elle n'en lit ni
  n'en conserve aucun de l'utilisateur.
- **Identifiants d'appareil = Non.** Aucun identifiant publicitaire, aucun
  identifiant matériel. Le compte est identifié par un numéro Firebase, déclaré
  plus haut sous « ID utilisateur ».

## Pratiques de sécurité

| Question | Réponse |
| --- | --- |
| Données chiffrées en transit | **Oui** |
| Suppression des données possible | **Oui** — dans l'application et à <https://rapidmusic.fr/#/suppression-compte> |
| Application validée par un audit de sécurité indépendant | **Non** |
| Engagement envers les règles « Familles » | **Non** — l'application ne vise pas les enfants |

## Ce que la suppression du compte efface — vraiment tout

Écrire cette page a mis au jour un reste : la collection **`courriels`** garde
l'adresse du destinataire des deux messages automatiques, et rien ne l'effaçait.
L'artiste supprimait son compte, son adresse restait.

C'est corrigé. Un troisième déclencheur, `oubli`, part sur la suppression d'un
compte et efface les trois restes :

| Ce qui reste | Pourquoi le navigateur ne peut pas l'effacer |
| --- | --- |
| `courriels` | fermée des deux côtés par les règles — elle contient des adresses |
| `abonnements/{uid}` | `allow write: if false`, le prix de son inviolabilité |
| `artistes/{uid}` | il le peut, et le fait déjà. Mais un compte supprimé depuis la console Firebase ne passe pas par l'application |

Aucune durée de conservation n'a donc été nécessaire : plutôt qu'attendre
quatre-vingt-dix jours, la trace part avec le compte. Un compte vivant n'a de
toute façon que deux traces.

Le lien entre l'écriture et l'effacement est sous test : la trace est écrite par
`sujetTrace`, qui y met le compte sous le nom exact que la suppression
interroge. Renommer ce champ d'un seul côté rendrait les traces ineffaçables
sans lever la moindre erreur — deux tests l'interdisent.

## Après l'envoi

Google réexamine la fiche à chaque nouvelle version. Ces réponses tiennent tant
que l'application ne change pas de nature. **Trois évènements imposent de
rouvrir cette page** :

- brancher un paiement — « Informations de paiement » et « Historique d'achats »
  entrent dans le tableau ;
- ajouter une mesure d'audience — « Interactions » aussi, et un bandeau de
  consentement avec ;
- ouvrir le Réseau entre artistes — les publications deviennent visibles par
  d'autres, et « Partagées » cesse d'être « Non » partout.
