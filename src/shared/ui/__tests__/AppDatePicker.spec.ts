import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDatePicker from '@/shared/ui/AppDatePicker.vue'

describe('AppDatePicker', () => {
  it('exposes a labelled native date input with constraints and hint text', () => {
    const wrapper = mount(AppDatePicker, {
      props: {
        label: 'Due date',
        hint: 'Choose the day this task should be completed.',
        name: 'dueDate',
        min: '2026-07-31',
        max: '2026-12-31',
      },
    })
    const input = wrapper.get('input[type="date"]')

    expect(input.attributes('name')).toBe('dueDate')
    expect(input.attributes('min')).toBe('2026-07-31')
    expect(input.attributes('max')).toBe('2026-12-31')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'))
  })

  it('emits an ISO date value and provides an accessible clear action', async () => {
    const wrapper = mount(AppDatePicker, {
      props: {
        label: 'Due date',
        modelValue: '',
      },
    })

    await wrapper.get('input').setValue('2026-08-10')

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
    const input = wrapper.get('input')

    expect(input.attributes()).toHaveProperty('required')
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
    const input = wrapper.get('input')
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
