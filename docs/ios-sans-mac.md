# Fabriquer et envoyer l'application iPhone sans Mac

Xcode n'existe que sur macOS, et rien ne permet d'envoyer une application iOS
depuis Windows ou Linux. Les serveurs de GitHub en louent un à la minute : le
workflow [`ios.yml`](../.github/workflows/ios.yml) s'en sert, et rend autonome
pour toutes les mises à jour suivantes.

> ⚠️ **Une minute de macOS est facturée dix minutes** sur le quota GitHub. Une
> fabrication en prend une quinzaine, soit cent cinquante au compteur. Sur un
> dépôt privé au forfait gratuit — deux mille minutes par mois — cela fait une
> douzaine de fabrications. Un dépôt public n'est pas décompté.

## Tout de suite, sans rien préparer

Le workflow tourne **sans aucun secret**. Il ne peut alors rien envoyer, mais il
compile — et c'est déjà l'essentiel : la compilation est la seule chose qui dise
si le code Swift est juste. Le greffon d'achat intégré, notamment, n'a jamais pu
être compilé ailleurs, faute de Mac.

**Onglet Actions → Application iPhone (.ipa) → Run workflow.**

S'il passe au vert, le projet iOS est sain. S'il échoue, le journal dit sur
quelle ligne — et c'est à savoir avant d'avoir monté toute la signature.

## Les six secrets

Dans **Réglages → Secrets and variables → Actions → New repository secret**.

| Secret | Où le trouver |
| --- | --- |
| `APPLE_CLE` | le contenu du fichier `.p8` — **le même** que pour la vérification des achats |
| `APPLE_ID_CLE` | l'identifiant de cette clef |
| `APPLE_ID_EDITEUR` | l'identifiant de l'éditeur |
| `APPLE_EQUIPE` | developer.apple.com → Membership → *Team ID*, dix caractères |
| `APPLE_CERTIFICAT_P12` | à fabriquer, voir ci-dessous |
| `APPLE_CERTIFICAT_MDP` | le mot de passe que **vous** choisirez en le fabriquant |

Les trois premiers sont déjà décrits dans [`facturation.md`](facturation.md) :
mêmes valeurs, rien à recréer.

## Fabriquer le certificat sans Mac

C'est la seule étape qui demande une ligne de commande. Elle se fait **une fois
pour toutes** : le certificat vaut un an, et sert à toutes les fabrications.

Il faut `openssl`. Sous Windows, il est livré avec **Git for Windows** — ouvrez
« Git Bash ». Sous Linux et macOS, il est déjà là.

### 1. Une clef privée et une demande de certificat

```sh
openssl genrsa -out cle-privee.key 2048
openssl req -new -key cle-privee.key -out demande.certSigningRequest \
  -subj "/emailAddress=VOTRE@ADRESSE.FR/CN=Votre Nom/C=FR"
```

**`cle-privee.key` ne doit jamais quitter votre machine ni entrer dans le
dépôt.** Sans elle, le certificat qu'Apple va signer ne vaut rien — et qui l'a
peut signer des applications en votre nom.

### 2. Faire signer la demande par Apple

developer.apple.com → **Certificates, Identifiers & Profiles** → Certificates →
**+** → **Apple Distribution** → téléversez `demande.certSigningRequest` →
téléchargez le `.cer`.

**Apple Distribution**, et non « Apple Development » : un certificat de
développement ne permet pas d'envoyer à l'App Store. Le workflow le vérifie et
le dit, plutôt que d'échouer quinze minutes plus tard sur un message obscur.

### 3. Réunir les deux en un `.p12`

```sh
openssl x509 -inform DER -in distribution.cer -out certificat.pem
openssl pkcs12 -export -legacy \
  -inkey cle-privee.key -in certificat.pem -out certificat.p12
```

Un mot de passe est demandé : c'est lui qui ira dans `APPLE_CERTIFICAT_MDP`.
Choisissez-en un, notez-le, il ne se retrouve pas.

`-legacy` n'est pas décoratif. Sans lui, OpenSSL 3 chiffre le fichier d'une
façon que le trousseau de macOS refuse d'ouvrir, et l'erreur parle d'un mot de
passe invalide alors que le mot de passe est bon. Si votre `openssl` est en
version 1, l'option n'existe pas et n'est pas nécessaire : retirez-la.

### 4. L'encoder pour GitHub

Un secret GitHub ne transporte que du texte, et un `.p12` est un fichier
binaire.

```sh
base64 -w0 certificat.p12          # Linux, Git Bash
base64 -i certificat.p12 | tr -d '\n'   # macOS
```

Copiez toute la sortie dans `APPLE_CERTIFICAT_P12`. Le workflow retire les
blancs avant de décoder — un retour à la ligne glissé par le presse-papier ne
casse rien — et, si le décodage échoue quand même, il décrit ce qu'il a reçu
sans en révéler le contenu.

## Envoyer

**Actions → Application iPhone (.ipa) → Run workflow**, puis cochez
**« Envoyer à App Store Connect »**.

Décoché — le réglage par défaut —, le workflow fabrique et dépose le `.ipa` en
pièce jointe de l'exécution, sans rien envoyer. C'est ce qu'on veut pour
vérifier que la chaîne fonctionne avant de déposer quoi que ce soit sur le
compte.

Le **numéro de fabrication** est celui de l'exécution GitHub, qui ne recule
jamais. Apple refuse un envoi dont le numéro n'est pas supérieur au précédent,
et c'est l'oubli le plus courant quand on le règle à la main.

Comptez **cinq à trente minutes** de traitement chez Apple avant que la
fabrication apparaisse dans App Store Connect, section *Build*.

## Ce que le workflow fait, dans l'ordre

1. fabrique le site (`npm run build`) et le recopie dans le projet iOS
   (`npx cap sync ios`) — **les deux vont ensemble**, sans la première on
   enverrait la version précédente du site sans que rien ne le signale ;
2. installe le certificat dans un trousseau temporaire, qui disparaît avec le
   serveur ;
3. archive, en laissant Xcode fabriquer le profil de provisionnement tout seul
   grâce à la clef d'API. Un profil se régénère sans conséquence — un
   certificat, non : Apple n'en autorise que deux par compte, et un serveur qui
   en créerait un à chaque fabrication aurait épuisé le quota au troisième
   essai. C'est pourquoi le certificat est fourni et le profil ne l'est pas ;
4. exporte le `.ipa` ;
5. l'envoie, si la case était cochée.

## Quand ça casse

| Symptôme | Cause habituelle |
| --- | --- |
| « n'est pas du base64 exploitable » | le secret contient autre chose que le fichier encodé — un chemin, un en-tête `BEGIN CERTIFICATE` |
| « il refuse ce mot de passe » | `APPLE_CERTIFICAT_MDP` est celui du compte Apple et non celui choisi à l'étape 3 — ou le `.p12` a été fait sans `-legacy` |
| « Aucun certificat de distribution » | le certificat créé est un « Apple Development » |
| L'envoi est refusé pour un numéro déjà pris | une fabrication précédente portait ce numéro. Relancer suffit : le suivant sera plus grand |
| Le certificat a expiré | il vaut un an. Refaire les quatre étapes, remplacer les deux secrets |

En cas d'échec, le journal d'Xcode est déposé en pièce jointe de l'exécution
(`journal-xcode-…`), au format que Xcode ouvre d'un double-clic. Il évite de
relancer quinze minutes de macOS pour relire ce qui vient de défiler.
