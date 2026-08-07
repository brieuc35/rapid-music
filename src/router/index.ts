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
  {
    path: '/reseau',
    name: 'social',
    component: () => import('@/views/SocialView.vue'),
    meta: { title: 'Réseau', icon: 'globe' },
  },
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
  { path: '/:pathMatch(.*)*', redirect: '/tableau-de-bord' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
