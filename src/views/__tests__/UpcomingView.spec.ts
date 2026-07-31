import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UpcomingView from '@/views/UpcomingView.vue'
import { useTasksStore } from '@/stores/tasks'
import { useSettingsStore } from '@/stores/settings'

describe('UpcomingView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates a scheduled task through the shared edit dialog', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useTasksStore()
    store.initialize()
    store.addTask({ title: 'Plan release', dueTo: '2026-08-02' })
    const wrapper = mount(UpcomingView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await wrapper.get('button[aria-label="Edit Plan release"]').trigger('click')
    await wrapper.get('input[name="editTitle"]').setValue('Ship release')
    await wrapper.get('input[name="editDueTo"]').setValue('2026-07-31')
    await wrapper.get('form[aria-label="Edit task"]').trigger('submit')

    expect(store.tasks[0]).toMatchObject({ title: 'Ship release', dueTo: '2026-07-31' })
    expect(store.upcoming.today.map((task) => task.title)).toEqual(['Ship release'])
    expect(store.upcoming.later).toEqual([])
  })

  it('groups future tasks using the configured first day of the week', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useTasksStore()
    const settings = useSettingsStore()
    store.initialize()
    store.addTask({ title: 'Sunday task', dueTo: '2026-08-02' })
    store.addTask({ title: 'Monday task', dueTo: '2026-08-03' })
    settings.weekStartsOn = 1
    const wrapper = mount(UpcomingView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    expect(wrapper.findAll('.later-week__title').map((heading) => heading.text())).toEqual([
      'This week',
      'Week of August 3, 2026',
    ])

    settings.weekStartsOn = 0
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.later-week__title').map((heading) => heading.text())).toEqual([
      'Week of August 2, 2026',
    ])
  })
})
