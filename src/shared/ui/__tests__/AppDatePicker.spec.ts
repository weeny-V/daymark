import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDatePicker from '@/shared/ui/AppDatePicker.vue'

describe('AppDatePicker', () => {
  it('exposes a labelled calendar trigger with constraints and hint text', async () => {
    const wrapper = mount(AppDatePicker, {
      props: {
        label: 'Due date',
        hint: 'Choose the day this task should be completed.',
        name: 'dueDate',
        min: '2026-07-31',
        max: '2026-12-31',
      },
    })
    const trigger = wrapper.get('.date-picker__trigger')

    expect(wrapper.get('input[type="hidden"]').attributes('name')).toBe('dueDate')
    expect(wrapper.get('label').attributes('for')).toBe(trigger.attributes('id'))
    expect(trigger.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'))

    await trigger.trigger('click')
    expect(wrapper.get('[role="dialog"]').attributes('aria-label')).toBe('Due date calendar')
    expect(wrapper.get('button[aria-label="Thursday, July 30, 2026"]').attributes()).toHaveProperty(
      'disabled',
    )
  })

  it('emits an ISO date value and provides an accessible clear action', async () => {
    const wrapper = mount(AppDatePicker, {
      props: {
        label: 'Due date',
        modelValue: '',
      },
    })

    await wrapper.get('.date-picker__trigger').trigger('click')
    await wrapper.get('button[aria-label="Monday, August 10, 2026"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toContainEqual(['2026-08-10'])

    await wrapper.get('button[aria-label="Clear due date"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toContainEqual([''])
  })

  it('supports required and disabled states', () => {
    const wrapper = mount(AppDatePicker, {
      props: {
        label: 'Start date',
        required: true,
        disabled: true,
      },
    })
    const input = wrapper.get('.date-picker__trigger')

    expect(input.attributes()).toHaveProperty('disabled')
    expect(wrapper.text()).not.toContain('Optional')
  })

  it('exposes an accessible error state while preserving the hint association', () => {
    const wrapper = mount(AppDatePicker, {
      props: {
        label: 'Due date',
        hint: 'Use the format shown in the picker.',
        error: 'Due date cannot be before today.',
      },
    })
    const input = wrapper.get('.date-picker__trigger')
    const hint = wrapper.get('.date-picker__hint')
    const error = wrapper.get('[role="alert"]')

    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      `${hint.attributes('id')} ${error.attributes('id')}`,
    )
    expect(error.text()).toBe('Due date cannot be before today.')
    expect(wrapper.classes()).toContain('date-picker--error')
  })
})
