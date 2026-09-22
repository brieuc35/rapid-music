# Ce qu'on répond à l'équipe de vérification d'Apple

Deux textes, en anglais, à garder : ils resservent à chaque soumission.

L'anglais n'est pas un choix de style. Apple traduit automatiquement ses
messages vers la langue du compte — d'où le français reçu — mais l'examen se
fait en anglais, et un texte déjà dans cette langue évite un aller-retour de
traduction approximative.

## 1. Les notes courtes

Elles vont dans **App Store Connect → la version → Informations pour la
vérification → Notes**, et elles y restent d'une version à l'autre.

```
RapidMusic is a career management app for independent musicians:
concerts, contracts, releases, royalties, studio sessions, tasks and
contacts. The interface is in French only.

DEMO ACCOUNT
Sign in on the first screen with the credentials provided above. The
account already contains sample data, so every tab has content.

SUBSCRIPTION — HOW TO TEST
The app is free to use. The only restriction on the free plan is the
number of saved contacts, limited to 3. "RapidMusic Pro" removes that
limit and unlocks three areas: Royalties & Revenus, Contrats, and the
fee amounts on the Concerts tab.

To reach the purchase screen: sign in, open the menu (top left), then
tap "Abonnement".

Two auto-renewable subscriptions are offered through StoreKit 2:
  pro_mensuel — monthly
  pro_annuel  — yearly

Purchases made with a sandbox Apple ID work as expected. The signed
transaction is verified server-side with the App Store Server API,
trying the production environment first and falling back to sandbox,
as recommended in Apple's documentation.

Subscription terms, Terms of Use and Privacy Policy are displayed at
the bottom of the purchase screen.

ACCOUNT DELETION
Account deletion is available in-app: Profil → "Supprimer mon compte".
It asks for the password, then erases the account and all its data.

CONTACT
<votre adresse e-mail>
```

## 2. La réponse longue à la directive 2.1

Reçue au premier envoi, le 22 septembre 2026. Ce n'est pas un défaut de
l'application : Apple la demande aux comptes développeurs dont l'« historique
d'évaluation est limité », c'est-à-dire neufs. Elle réclame un enregistrement
vidéo et sept points de description.

Le texte ci-dessous répond aux points 2 à 7. Il se colle **dans le Resolution
Center** en réponse au refus, et Apple demande de le reporter aussi dans le
champ « Notes » pour les fois suivantes.

```
Thank you for the review. Here is the information requested.

2. PURPOSE AND TARGET AUDIENCE

RapidMusic is a career management tool for independent musicians and
small labels. Its audience is self-managed artists, mainly in France —
the app is in French only.

The problem it solves: an independent musician's career data is
scattered across spreadsheets, notes, calendars and email threads —
concert dates and fees, contracts, release schedules, streaming
royalties, studio sessions, tasks and professional contacts. RapidMusic
keeps all of it in one place, on the artist's own account, with a
dashboard showing what is coming up and what is owed.

It is a private productivity tool. There is no social feed, no
user-to-user interaction and no publicly visible content.

3. HOW TO SET UP AND ACCESS THE MAIN FEATURES

Sign in on the first screen with the demo account provided in App Store
Connect (App Review Information → Sign-In Required). No other setup,
file or hardware is required. The demo account is pre-filled with sample
data, so every tab has content.

The main features, reachable from the sidebar on iPad, and from the
bottom tab bar and the menu on iPhone:

  Tableau de bord  dashboard — upcoming events, income, pending contracts
  Concerts         tour dates, venues, ticketing, fees
  Sorties          release catalogue — singles, EPs, albums, streams
  Royalties        income per streaming platform, statement import (Pro)
  Contrats         contract tracking — status, advances, rates (Pro)
  Agenda           studio sessions, interviews, meetings, calendar
  Tâches           to-do list with due dates
  Contacts         professional address book
  Label            label profile
  Mon profil       artist profile, data export and import, account deletion

Account creation, sign-in and account deletion all happen in the app.
Account deletion is at Profil → "Supprimer mon compte"; it asks for the
password, then permanently erases the account and all its data.

The app has no user-generated content shared between users, so no
reporting or blocking mechanism applies.

4. EXTERNAL SERVICES USED

  Firebase Authentication (Google)  email and password sign-in
  Cloud Firestore (Google)          storage of the user's own data
  Cloud Functions (Google)          server-side logic, region europe-west1
  App Store Server API (Apple)      subscription status verification
  Google Play Billing (Google)      subscriptions on the Android build only
  An SMTP email provider            transactional email

There is no other payment processor: on iOS, every purchase goes through
Apple's in-app purchase system. The app uses no AI service, no
advertising network, no analytics SDK and no third-party data provider.

5. REGIONAL DIFFERENCES

None. The app behaves identically in every region. It is available in
French only. Subscription prices are set in euros and converted by Apple
for other storefronts.

6. REGULATED INDUSTRY OR THIRD-PARTY PROTECTED CONTENT

Neither. RapidMusic does not operate in a regulated industry. It stores
only data the user enters about their own career. It does not play,
stream, host or distribute any music or other copyrighted material — it
records metadata such as titles, dates and figures. The sample data in
the demo account is fictional.

7. IN-APP PURCHASES

The app is free to use. The only restriction on the free plan is the
number of saved contacts, limited to 3.

"RapidMusic Pro" removes that limit and unlocks three areas: Royalties &
Revenus, Contrats, and the fee amounts on the Concerts tab.

To navigate to the purchase flow: sign in, then open the menu (top left
on iPhone) and tap "Abonnement". On iPad it is in the sidebar, or via
the "Passer à Pro" button at the bottom of the sidebar.

Two auto-renewable subscriptions, both in the group "RapidMusic Pro":

  pro_mensuel  RapidMusic Pro, 1 month, EUR 9.99
  pro_annuel   RapidMusic Pro, 1 year,  EUR 99.00

For the selected option, the purchase screen shows the title ("Pro"),
the duration ("Au mois" / "À l'année"), the price per month and, for the
yearly option, the amount charged once a year. Below the purchase button
it states that the subscription renews automatically unless cancelled at
least 24 hours before the end of the period, and it carries links to the
Terms of Use and to the Privacy Policy.

Purchases use StoreKit 2. The signed transaction is verified server-side
with the App Store Server API, trying the production environment first
and falling back to sandbox.
```

## 3. L'enregistrement d'écran

Le point 1 de la demande, et le seul qui réclame du travail : Apple veut une
vidéo prise **sur un appareil physique**, pas sur un simulateur.

Le paquet arrive sur l'iPhone par **TestFlight** — il y est déjà, chaque envoi
du workflow y atterrit. Inutile de refabriquer quoi que ce soit.

L'enregistrement se fait avec la fonction d'iOS : *Réglages → Centre de
contrôle → Enregistrement de l'écran*, puis le bouton rond depuis le centre de
contrôle.

Ce que la vidéo doit montrer, dans cet ordre :

1. **le lancement depuis l'écran d'accueil** — Apple l'exige explicitement ;
2. **la création d'un compte**, avec une adresse jetable ;
3. le tableau de bord, puis Concerts, Agenda, Tâches, Sorties, Contacts ;
4. **l'écran d'abonnement**, en s'y arrêtant cinq bonnes secondes : le titre, la
   durée, le prix et les deux liens doivent être lisibles à l'image. Ouvrir
   chacun des deux liens et revenir ;
5. **l'achat**, avec un compte de bac à sable, puis les onglets Revenus et
   Contrats qui s'ouvrent ;
6. **la suppression du compte** — Profil → Supprimer mon compte.

⚠️ **La suppression se fait sur le compte créé à l'étape 2, jamais sur le compte
de démonstration.** Supprimer celui-ci couperait l'accès au vérificateur, et le
refus suivant serait, lui, mérité.

Deux à quatre minutes suffisent. La vidéo se joint directement à la réponse dans
le Resolution Center.
