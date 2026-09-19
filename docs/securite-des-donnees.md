# Ce que l'application collecte, et comment le déclarer

Les deux magasins posent la même question dans des formulaires différents :
**Sécurité des données** chez Google, **Confidentialité de l'app** chez Apple.
Les faits sont les mêmes ; seules les cases changent de nom. Ce document établit
les faits une fois, puis les range pour chacun des deux.

Réponses à recopier, établies en relisant le code — pas de mémoire. Chaque
réponse indique **d'où elle vient**, pour qu'elle puisse être revérifiée le jour
où l'application changera.

> Ces formulaires engagent le compte développeur. Une déclaration fausse est un
> motif de retrait. Trois réponses relèvent d'un jugement plutôt que d'un fait :
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
| Informations de paiement | **Non** | — | la carte est vue par le magasin, jamais par nous |
| Historique d'achats | **Oui** | Facultatif | Fonctionnalité |
| Solvabilité | **Non** | — | — |
| Autres informations financières | **Oui** | Facultatif | Fonctionnalité |

« Autres informations financières » couvre les cachets de concerts, les montants
et taux des contrats, et les revenus de streaming. Ce sont les **revenus** de
l'artiste, pas des moyens de paiement — la distinction compte.

« Historique d'achats » est passé à Oui le jour où la facturation est arrivée.
`abonnements/{uid}` garde la formule en cours et ses dates : c'est un achat
enregistré chez nous, donc déclaré. Les moyens de paiement, eux, restent hors
de portée — Google et Apple encaissent, nous ne recevons qu'un verdict.

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

## Le questionnaire d'Apple

Les mêmes faits, rangés autrement. App Store Connect pose trois questions par
type collecté, et les trois ont ici la même réponse partout :

| Question d'Apple | Réponse | Pourquoi |
| --- | --- | --- |
| Utilisées pour le suivi ? | **Non**, sans exception | rien ne part vers un courtier en données, et rien ne sert à la publicité d'une autre application. C'est ce qui dispense l'application de demander l'autorisation de suivi |
| Liées à l'utilisateur ? | **Oui**, sans exception | tout est enregistré sous le compte de l'artiste ; rien n'est anonymisé |
| Finalité | **Fonctionnalité de l'app** | la seule. Ni analyse, ni personnalisation, ni marketing |

Les types à cocher :

| Catégorie d'Apple | Collecté | Ce que c'est ici |
| --- | --- | --- |
| Coordonnées → Nom | **Oui** | nom de scène, obligatoire ; nom réel, facultatif |
| Coordonnées → Adresse e-mail | **Oui** | l'identifiant de connexion |
| Coordonnées → Numéro de téléphone | **Oui** | champ du profil |
| Coordonnées → Autres coordonnées | **Oui** | liens Instagram, Spotify, site web |
| Coordonnées → Adresse physique | Non | seule une ville en texte libre existe |
| Informations financières → Autres | **Oui** | cachets, montants de contrats, revenus de streaming |
| Informations financières → Paiement | Non | la carte est vue par Apple, jamais par nous |
| Contacts | **Oui** | le carnet professionnel saisi à la main |
| Contenu utilisateur → Photos ou vidéos | **Oui** | la photo de profil |
| Contenu utilisateur → Autre contenu | **Oui** | concerts, sorties, contrats, tâches, agenda, notes |
| Identifiants → ID utilisateur | **Oui** | l'identifiant Firebase |
| Identifiants → ID d'appareil | Non | aucun identifiant matériel ni publicitaire |
| Achats → Historique des achats | **Oui** | la formule en cours et ses dates |
| Données d'utilisation | Non | aucune mesure d'audience |
| Diagnostics | Non | aucun rapport de plantage |
| Position, Santé, Informations sensibles, Historique de navigation, Historique des recherches, Autres données | Non | — |

⚖️ **La position.** La ville de l'artiste est un champ de texte qu'il remplit
lui-même ; aucun service de localisation n'est appelé, et l'application ne
demande jamais cette autorisation. « Position » reste donc à Non. La ville est
déclarée là où elle est vraiment — dans le contenu que l'utilisateur saisit.

⚖️ **Les contacts.** Le répertoire du téléphone n'est **jamais** lu, mais
l'application enregistre des fiches professionnelles avec noms, adresses et
téléphones. C'est bien de l'information de contact conservée sur nos serveurs,
donc déclarée. Ne pas la déclarer sous prétexte qu'elle est tapée à la main
serait risqué. Même raisonnement que pour Google.

L'adresse de la politique de confidentialité, réclamée avant tout examen :
<https://rapidmusic.fr/#/confidentialite>

Le champ « URL des choix de confidentialité » est facultatif et reste vide :
il attend une page où l'on modifie ou retire un consentement, et il n'y a pas
de consentement à retirer ici. La suppression du compte, elle, se fait dans
l'application.

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

Les deux magasins réexaminent la fiche à chaque nouvelle version, et une
déclaration corrigée d'un seul côté est une déclaration fausse de l'autre. Ces
réponses tiennent tant que l'application ne change pas de nature. **Trois
évènements imposent de rouvrir cette page** :

- ~~brancher un paiement~~ — **fait.** « Historique d'achats » est entré dans le
  tableau ; « Informations de paiement » est resté à Non, parce que les magasins
  encaissent et ne nous montrent jamais de carte ;
- ajouter une mesure d'audience — « Interactions » aussi, et un bandeau de
  consentement avec ;
- ouvrir le Réseau entre artistes — les publications deviennent visibles par
  d'autres, et « Partagées » cesse d'être « Non » partout.
