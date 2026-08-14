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
| Nom complet | RapidMusic — gestion de carrière | fiche du Store |
| Barre d'état | `#14101F` | couleur de la barre de navigation de l'application |
| Barre système du bas | `#F6F7FB` | fond des pages |
| Écran de lancement | `#14101F` | enchaîne sans rupture sur l'écran d'attente de l'application |
| Version | 1.0.0 (code 1) | le **code** doit augmenter à chaque envoi |

## Fabriquer le fichier `.aab`

Google n'accepte que des fichiers `.aab` (_Android App Bundle_). Deux chemins ;
le premier ne demande aucune installation.

### Chemin A — PWABuilder (recommandé)

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

### Chemin B — Bubblewrap en local

Demande Node, un JDK et le SDK Android (environ 1 Go de téléchargement).

```sh
npm install -g @bubblewrap/cli
cd android          # twa-manifest.json y est déjà, avec tous les réglages
bubblewrap build    # crée la clé de signature au premier appel
```

> Ce dépôt ne peut pas exécuter cette étape : la politique réseau de
> l'environnement bloque `dl.google.com`, seule source du SDK Android et des
> versions actuelles du plugin Gradle Android (Maven Central s'arrête à 2017).

## L'étape qu'il ne faut pas rater : `assetlinks.json`

Sans elle, l'application s'ouvre **avec une barre d'adresse en haut** : elle a
l'air d'un navigateur déguisé, et Google peut refuser la fiche. C'est la cause
numéro un des rejets pour ce type d'application.

Le fichier est déjà servi, à la bonne adresse :
<https://rapidmusic.fr/.well-known/assetlinks.json> — il lui manque seulement
l'empreinte de la clé de signature.

**Quelle empreinte ?** Celle de la clé qui signe l'application **livrée aux
téléphones**. Comme la signature par Google Play est obligatoire pour toute
nouvelle application, Google resigne le paquet : l'empreinte à publier est donc
la sienne, pas celle du magasin de clés créé à l'étape précédente.

1. Envoyer le `.aab` dans la Play Console (un test fermé suffit).
2. Console → **Test et publication** → **Intégrité de l'application** →
   *Certificat de la clé de signature de l'application* → copier
   l'empreinte **SHA-256**.
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
- formulaire « Sécurité des données », classification du contenu, public visé ;
- adresses des pages légales, déjà en ligne :
  - <https://rapidmusic.fr/#/confidentialite> (obligatoire) ;
  - <https://rapidmusic.fr/#/suppression-compte> (obligatoire dès qu'il y a des
    comptes) ;
  - <https://rapidmusic.fr/#/mentions-legales>, <https://rapidmusic.fr/#/conditions> ;
- fiche : icône 512×512 (`public/icon-512.png`), image de mise en avant
  1024×500, deux captures d'écran de téléphone au minimum.

## Rappel sur l'abonnement

Vendre un abonnement dans l'application Android impose **Google Play Billing**
et sa commission. Le plus simple pour une première publication : garder la
version Android entièrement gratuite, sans aucune mention de paiement, et
vendre sur le site.
