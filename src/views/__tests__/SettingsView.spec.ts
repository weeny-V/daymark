import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import SettingsView from '@/views/SettingsView.vue'
import { useSettingsStore } from '@/stores/settings'

const mountSettingsView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useSettingsStore().initialize()

  return mount(SettingsView, {
    global: {
      plugins: [pinia],
    },
  })
}

describe('SettingsView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    document.body.replaceChildren()
  })

  it('renders one heading and a labelled control for every preference', () => {
    const wrapper = mountSettingsView()

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Settings')
    expect(wrapper.get('fieldset').text()).toContain('Color theme')
    expect(wrapper.findAll('select')).toHaveLength(3)
    expect(wrapper.text()).toContain('Date format')
    expect(wrapper.text()).toContain('First day of the week')
    expect(wrapper.text()).toContain('Default task priority')
  })

  it('updates preferences and announces a reset', async () => {
    const wrapper = mountSettingsView()
    const store = useSettingsStore()
    const selects = wrapper.findAll('select')

    await wrapper.get('input[value="dark"]').setValue(true)
    await selects[0]!.setValue('YYYY-MM-DD')
    await selects[2]!.setValue('high')

    expect(store.theme).toBe('dark')
    expect(store.dateFormat).toBe('YYYY-MM-DD')
    expect(store.defaultTaskPriority).toBe('high')

    await wrapper.get('button').trigger('click')

    expect(store.theme).toBe('system')
    expect(store.defaultTaskPriority).toBe('medium')
    expect(wrapper.get('[role="status"]').text()).toContain('reset to their defaults')
  })

  it('has no critical automated accessibility violations', async () => {
    const wrapper = mountSettingsView()
    document.body.append(wrapper.element)

    const results = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
      },
    })

    expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([])
  })
})
