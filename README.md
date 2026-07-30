# 🎵 RapidMusic

**Le gestionnaire de carrière tout-en-un pour les artistes.**

RapidMusic réunit dans une seule application moderne et simple tout ce dont un
artiste a besoin pour piloter sa carrière au quotidien : contrats, concerts,
sorties, revenus des plateformes, calendrier studio, contacts et label.

---

## ✨ Fonctionnalités

| Onglet | Description |
| --- | --- |
| **Tableau de bord** | Vue d'ensemble : revenus du mois, prochains concerts, streams cumulés, contrats actifs, agenda studio et dernières sorties. |
| **Contrats** | Suivi de tous les accords (enregistrement, édition, booking, licence…) avec statut, période, avance et taux artiste. |
| **Concerts** | Dates de tournée avec salle, ville, cachet, jauge et billetterie, taux de remplissage moyen. |
| **Sorties** | Catalogue de singles, EP, albums et remix avec pochette colorée, statut, ISRC et streams. |
| **Royalties & Revenus** | Revenus des plateformes de streaming, graphique d'évolution, répartition par plateforme et relevés détaillés. |
| **Calendrier studio** | Calendrier mensuel des sessions (enregistrement, mix, mastering, répétition, écriture, réunion). |
| **Contacts** | Carnet d'adresses professionnel avec favoris, catégories, email et téléphone cliquables. |
| **Label** | Profil du label, partenaires (distribution, édition), profil artiste et roster. |

Chaque section propose l'ajout, la modification, la suppression, la recherche
et le filtrage. Les données sont enregistrées **localement dans le navigateur**
(`localStorage`) — aucune connexion requise. Des données d'exemple sont fournies
au premier lancement (réinitialisables depuis l'onglet *Label*).

## 🛠️ Stack technique

- [Vue 3](https://vuejs.org/) (`<script setup>` + TypeScript)
- [Vue Router](https://router.vuejs.org/)
- [Vite](https://vite.dev/) pour le build et le serveur de développement
- Design system maison en CSS (aucune dépendance UI externe)

## 🚀 Démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Générer la version de production
npm run build

# Prévisualiser la version de production
npm run preview
```

L'application est ensuite disponible sur `http://localhost:5173` (dev) ou
`http://localhost:4173` (preview).

## 📁 Structure

```
src/
├── components/     Composants réutilisables (Modal, Icon, cartes…)
├── views/          Une vue par onglet
├── store/          Store réactif + persistance localStorage + données d'exemple
├── router/         Configuration des routes
├── utils/          Fonctions de formatage (dates, montants…)
└── styles/         Système de design (CSS global)
```
