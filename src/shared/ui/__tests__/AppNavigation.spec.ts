import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppNavigation from '@/shared/ui/AppNavigation.vue'

const mountNavigation = async (path = '/today') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      '/today', '/tasks', '/habits', '/focus', '/upcoming', '/notes', '/settings',
    ].map((route) => ({ path: route, component: { template: '<div />' } })),
  })
  await router.push(path)
  await router.isReady()
  return mount(AppNavigation, { global: { plugins: [router] } })
}

describe('AppNavigation', () => {
  it('keeps all destinations in the desktop list and four primary mobile tabs', async () => {
    const wrapper = await mountNavigation()

    expect(wrapper.findAll('.app-navigation__list--desktop a')).toHaveLength(7)
    expect(wrapper.findAll('.app-navigation__list--mobile a').map((link) => link.text())).toEqual([
      'Today', 'Tasks', 'Habits', 'Focus',
    ])
    expect(wrapper.get('button[aria-controls="mobile-more-sheet"]').text()).toBe('More')
  })

  it('opens an accessible More sheet with secondary destinations', async () => {
    const wrapper = await mountNavigation('/notes')
    const moreButton = wrapper.get('button[aria-controls="mobile-more-sheet"]')

    expect(moreButton.classes()).toContain('nav-link--active')
    await moreButton.trigger('click')

    expect(wrapper.get('[role="dialog"]').attributes('aria-modal')).toBe('true')
    expect(wrapper.findAll('.more-link').map((link) => link.text())).toEqual([
      'Upcoming›', 'Notes›', 'Settings›',
    ])
    await wrapper.get('button[aria-label="Close more navigation"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
