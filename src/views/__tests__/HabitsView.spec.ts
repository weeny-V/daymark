import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import HabitsView from '@/views/HabitsView.vue'
import { useHabitsStore } from '@/stores/habits'

const mountView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useHabitsStore().initialize()
  return mount(HabitsView, { global: { plugins: [pinia] } })
}

describe('HabitsView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  it('shows a dedicated empty state when there are no habits', () => {
    const wrapper = mountView()

    expect(wrapper.get('#empty-state-title').text()).toBe('No habits yet')
    expect(wrapper.get('.empty-state .app-button').text()).toBe('Add your first habit')
    expect(wrapper.find('.day-card').exists()).toBe(false)
  })

  it('validates and creates a selected-weekday habit', async () => {
    const wrapper = mountView()
    await wrapper.get('button').trigger('click')
    await wrapper.get('form[aria-label="Habit details"]').trigger('submit')
    expect(wrapper.text()).toContain('Habit name cannot be empty')

    await wrapper.get('input[name="habitName"]').setValue('Evening walk')
    await wrapper.get('input[value="weekdays"]').setValue(true)
    await wrapper.get('button[aria-label="Monday"]').trigger('click')
    await wrapper.get('form[aria-label="Habit details"]').trigger('submit')

    expect(useHabitsStore().habits[0]).toMatchObject({
      name: 'Evening walk',
      schedule: { type: 'weekdays', weekdays: [1] },
    })
  })

  it('communicates completion with checkbox state and text', async () => {
    const wrapper = mountView()
    const store = useHabitsStore()
    store.addHabit({ name: 'Drink water', schedule: { type: 'daily' } })
    await wrapper.vm.$nextTick()

    const checkbox = wrapper.get('.check-control input')
    expect(wrapper.text()).toContain('Ready to complete')
    await checkbox.setValue(true)
    expect(wrapper.text()).toContain('Completed')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('edits and deletes a habit', async () => {
    const wrapper = mountView()
    const store = useHabitsStore()
    store.addHabit({ name: 'Journal', schedule: { type: 'daily' } })
    await wrapper.vm.$nextTick()

    await wrapper.get('button[aria-label="Edit Journal"]').trigger('click')
    await wrapper.get('input[name="habitName"]').setValue('Write journal')
    await wrapper.get('form[aria-label="Habit details"]').trigger('submit')
    expect(store.habits[0]!.name).toBe('Write journal')

    await wrapper.get('button[aria-label="Delete Write journal"]').trigger('click')
    expect(store.habits).toEqual([])
  })

  it('has no critical automated accessibility violations', async () => {
    const wrapper = mountView()
    document.body.append(wrapper.element)
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([])
  })
})
