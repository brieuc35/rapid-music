import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '../views/Tabs.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/feed'
  },
  {
    path: '/profile/:handle',
    component: () => import('@/views/CreatorProfile.vue')
  },
  {
    path: '/notifications',
    component: () => import('@/views/NotificationsPage.vue')
  },
  {
    path: '/tabs/',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/tabs/feed'
      },
      {
        path: 'feed',
        component: () => import('@/views/FeedTab.vue')
      },
      {
        path: 'clips',
        component: () => import('@/views/ClipsTab.vue')
      },
      {
        path: 'news',
        component: () => import('@/views/NewsTab.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
