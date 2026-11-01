# L'assistant

Un spécialiste du métier de la musique, dans l'application, qui connaît le
dossier de l'artiste. Réservé aux abonnés Pro.

## Ce qui le distingue d'un assistant ouvert à côté

Rien, s'il ne lit pas le dossier. Un artiste qui veut un conseil général sur les
contrats l'obtient gratuitement ailleurs, et mieux. Ce qu'il ne peut obtenir
nulle part, c'est une réponse qui tienne compte **de ses dates, de ses contrats
et de ses revenus à lui**.

C'est donc la seule décision qui compte dans tout ce qui suit : le dossier part
avec chaque question. Tout le reste en découle — l'abonnement qui le réserve, le
quota qui le borne, la politique de confidentialité qui le déclare.

## Les pièces

| Fichier | Rôle |
| --- | --- |
| `functions/src/assistant.ts` | les instructions, le dossier, le quota — sans réseau, donc testé |
| `functions/src/index.ts` → `assistant` | la fonction appelable : abonnement, quota, appel à Claude |
| `src/utils/assistant.ts` | l'appel depuis le navigateur, et rien d'autre |
| `src/utils/assistant-texte.ts` | le Markdown de la réponse, traduit en HTML sûr |
| `src/views/AssistantView.vue` | l'écran |

Trois choses ne peuvent pas vivre dans le navigateur, et la première suffirait :

1. **la clef d'API.** Posée dans une page web, elle est publique — il suffit
   d'ouvrir les outils de développement pour la lire — et elle se facture à
   l'usage ;
2. **l'abonnement.** `abonnements/{uid}` est fermé à l'écriture : seul le
   serveur sait qui a payé ;
3. **le quota.** Un compteur tenu dans le navigateur se remet à zéro en
   rechargeant la page.

## Ce qu'il faut régler, une fois

### 1. Créer la clef chez Anthropic

Sur <https://console.anthropic.com> → **API Keys** → *Create Key*. Elle commence
par `sk-ant-`. **Elle ne se réaffiche jamais** : copiez-la tout de suite.

Prévoyez d'y déposer du crédit, ou d'y attacher une carte : sans solde, la
fonction répond « l'assistant n'a pas répondu » et les journaux disent pourquoi.

### 2. Déposer le secret

Console Google Cloud → **Secret Manager** → *Créer un secret*, nommé exactement
`ANTHROPIC_CLE`, la clef pour valeur. Puis donner au compte de service des
fonctions — `courriels@rapidmusic-db075.iam.gserviceaccount.com` — le rôle
**Accesseur de secrets Secret Manager** sur ce secret.

C'est la même marche à suivre que pour les trois secrets d'Apple ; le détail,
avec les captures, est dans [`facturation.md`](facturation.md), étape 3.

### 3. Redéployer

Onglet Actions → **Fonctions serveur (déploiement)**. Un secret créé après un
déploiement n'est pas vu par les fonctions déjà en place : elles sont liées à la
version du secret connue au moment où elles ont été déployées.

## Ce que ça coûte

Le modèle est **Claude Opus 5.5**, à 4 $ le million de jetons en entrée et 20 $
en sortie.

Une question coûte en pratique **deux à trois centimes** : le dossier et les
instructions font un à deux milliers de jetons, la réponse en fait quelques
centaines. Un abonné qui poserait ses cinquante questions du mois reviendrait
donc à un peu plus d'un euro, sur un abonnement à 9,99 €.

Trois garde-fous bornent la dépense, et aucun n'est décoratif :

| Garde-fou | Où | Ce qu'il empêche |
| --- | --- | --- |
| Réservé aux abonnés | `assistant` → `estPro` | qu'un compte gratuit dépense |
| 50 questions par mois | `LIMITE_MENSUELLE` | qu'une boucle ou un compte partagé fasse exploser la facture |
| 16 tours, 4 000 caractères | `conversationPropre` | qu'une conversation refacture son début à chaque question |

Le compteur est daté (`{ mois, nombre }`) : il se remet à zéro tout seul au
changement de mois, sans tâche planifiée à faire tourner la nuit du 1er.

**Pour changer de modèle**, une ligne dans `functions/src/assistant.ts` :
`MODELE`. `claude-haiku-5-5` divise la facture par quarante — 0,10 $ et 0,50 $
le million — au prix de réponses moins fines sur les questions de contrat. C'est
un arbitrage d'éditeur, pas un réglage technique.

## Ce qui part, et ce qui ne part pas

Partent chez Anthropic : les instructions, le dossier de l'artiste, et la
conversation en cours.

**Ne partent pas : les coordonnées des contacts.** `dossier` les compte par
catégorie sans les nommer, et un test l'exige. Ce sont des données de tiers, qui
n'ont consenti à rien : « aucun contact presse » fonde un conseil, une adresse
électronique n'y ajoute rien.

Les conversations ne sont enregistrées nulle part : elles vivent dans l'onglet
ouvert et disparaissent avec lui. C'est un choix, et il se discute — un
historique serait utile, il demanderait une collection, des règles, et une
réponse à « combien de temps ».

La politique de confidentialité déclare Anthropic comme sous-traitant et décrit
tout cela — voir `src/views/ConfidentialiteView.vue`. **À tenir à jour** : c'est
une obligation, pas une précaution.

## Les instructions données au modèle

Dans `INSTRUCTIONS`. Trois règles valent d'être comprises avant d'y toucher :

- **ne rien inventer de chiffré.** Un assistant qui estime un cachet plausible
  rend un service pire que l'absence de réponse : l'artiste le répétera à un
  tourneur ;
- **renvoyer vers un professionnel** sur le droit et la fiscalité. Ce sont les
  deux domaines où une réponse approximative coûte cher et longtemps ;
- **le contexte est français.** SACEM, SPPF, intermittence, GUSO, CNM. La
  réponse américaine serait fausse ici.

## Quand ça ne marche pas

| Message à l'écran | Cause |
| --- | --- |
| « L'assistant est réservé aux abonnés » | le compte n'est pas Pro, ou `abonnements/{uid}` a été refermé |
| « Vous avez posé vos 50 questions du mois » | le quota, qui repart le 1er |
| « L'assistant n'a pas répondu » | la clef manque, le solde est vide, ou Anthropic est injoignable — les journaux nomment lequel |

Les journaux se lisent sans rien installer : Actions → **Journaux des fonctions
(lecture)**, fonction `assistant`. Chaque réponse rendue y écrit le nombre de
jetons consommés en entrée et en sortie, ce qui permet de suivre la dépense
réelle plutôt que de l'estimer.
