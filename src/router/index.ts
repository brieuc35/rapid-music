import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tableau-de-bord' },
  {
    path: '/tableau-de-bord',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Tableau de bord', icon: 'dashboard' },
  },
  {
    path: '/contrats',
    name: 'contracts',
    component: () => import('@/views/ContractsView.vue'),
    meta: { title: 'Contrats', icon: 'contract' },
  },
  {
    path: '/concerts',
    name: 'concerts',
    component: () => import('@/views/ConcertsView.vue'),
    meta: { title: 'Concerts', icon: 'concert' },
  },
  {
    path: '/sorties',
    name: 'releases',
    component: () => import('@/views/ReleasesView.vue'),
    meta: { title: 'Sorties', icon: 'release' },
  },
  {
    path: '/royalties',
    name: 'royalties',
    component: () => import('@/views/RoyaltiesView.vue'),
    meta: { title: 'Royalties & Revenus', icon: 'money' },
  },
  {
    path: '/studio',
    name: 'studio',
    component: () => import('@/views/StudioView.vue'),
    meta: { title: 'Agenda', icon: 'calendar' },
  },
  {
    path: '/taches',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: { title: 'Tâches', icon: 'check' },
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('@/views/ContactsView.vue'),
    meta: { title: 'Contacts', icon: 'contacts' },
  },
  {
    path: '/label',
    name: 'label',
    component: () => import('@/views/LabelView.vue'),
    meta: { title: 'Label', icon: 'label' },
  },
  /*  Le Réseau n'est pas encore ouvert. La vue existe toujours (SocialView),
   *  mais elle n'est plus reliée : une adresse encore accessible ferait entrer
   *  dans un fil de démonstration quiconque a gardé un signet, et laisserait
   *  croire à un service ouvert. À rebrancher quand il le sera vraiment. */
  { path: '/reseau', redirect: '/tableau-de-bord' },
  {
    path: '/mon-profil',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: 'Mon profil', icon: 'users' },
  },
  {
    path: '/abonnement',
    name: 'pricing',
    component: () => import('@/views/PricingView.vue'),
    meta: { title: 'Abonnement', icon: 'star' },
  },
  /*  Les documents légaux. `public: true` les rend consultables sans compte :
   *  c'est une obligation — on ne peut pas exiger de créer un compte pour lire
   *  ce à quoi on s'engage, ni pour savoir comment le supprimer. */
  {
    path: '/mentions-legales',
    name: 'legal-notice',
    component: () => import('@/views/MentionsLegalesView.vue'),
    meta: { title: 'Mentions légales', public: true },
  },
  {
    path: '/confidentialite',
    name: 'privacy',
    component: () => import('@/views/ConfidentialiteView.vue'),
    meta: { title: 'Politique de confidentialité', public: true },
  },
  {
    path: '/conditions',
    name: 'terms',
    component: () => import('@/views/ConditionsView.vue'),
    meta: { title: "Conditions d'utilisation", public: true },
  },
  {
    path: '/suppression-compte',
    name: 'account-deletion',
    component: () => import('@/views/SuppressionCompteView.vue'),
    meta: { title: 'Supprimer mon compte', public: true },
  },
  /*  La page d'atterrissage des liens envoyés par Firebase — confirmation
   *  d'adresse, mot de passe oublié. Publique par nécessité : on y arrive
   *  depuis un courriel, avant toute connexion, et souvent depuis un autre
   *  appareil que celui où l'on est connecté.
   *
   *  Elle remplace la page de Google, en anglais et à ses couleurs. Le renvoi
   *  se règle dans la console : Authentication → Templates → « Personnaliser
   *  l'URL d'action » → https://rapidmusic.fr/#/action */
  {
    path: '/action',
    name: 'auth-action',
    component: () => import('@/views/ActionView.vue'),
    meta: { title: 'Lien RapidMusic', public: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/tableau-de-bord' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
