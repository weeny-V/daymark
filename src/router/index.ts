import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/today' },
    {
      path: '/today',
      name: 'today',
      component: () => import('../views/TodayView.vue'),
      meta: {
        title: 'Today',
        navigationLabel: 'Today',
      },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/TasksView.vue'),
      meta: {
        title: 'Tasks',
        navigationLabel: 'Tasks',
      },
    },
    {
      path: '/upcoming',
      name: 'upcoming',
      component: () => import('../views/UpcomingView.vue'),
      meta: {
        title: 'Upcoming',
        navigationLabel: 'Upcoming',
      },
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('../views/HabitsView.vue'),
      meta: {
        title: 'Habits',
        navigationLabel: 'Habits',
      },
    },
    {
      path: '/focus',
      name: 'focus',
      component: () => import('../views/FocusView.vue'),
      meta: {
        title: 'Focus',
        navigationLabel: 'Focus',
      },
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/NotesView.vue'),
      meta: {
        title: 'Notes',
        navigationLabel: 'Notes',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: {
        title: 'Settings',
        navigationLabel: 'Settings',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Page not found',
      },
    },
  ],
  scrollBehavior: (to) => (to.hash ? { el: to.hash } : { top: 0 }),
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'Daymark')} · Daymark`
  void nextTick(() => document.querySelector<HTMLElement>('#main-content')?.focus())
})

export default router
