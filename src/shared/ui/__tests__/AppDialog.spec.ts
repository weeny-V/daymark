import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppDialog from '@/shared/ui/AppDialog.vue'

describe('AppDialog', () => {
  it('opens with accessible title and description relationships', async () => {
    const wrapper = mount(AppDialog, {
      props: {
        open: true,
        title: 'Edit due date',
        description: 'Choose when this task should be completed.',
      },
      slots: {
        default: '<p>Dialog content</p>',
      },
    })

    await nextTick()
    const dialog = wrapper.get('dialog')
    const title = wrapper.get('h2')
    const description = wrapper.get('.app-dialog__header p')

    expect(dialog.attributes()).toHaveProperty('open')
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(dialog.attributes('aria-describedby')).toBe(description.attributes('id'))
    expect(wrapper.text()).toContain('Dialog content')
  })

  it('requests closing from the close button', async () => {
    const wrapper = mount(AppDialog, {
      props: { open: true, title: 'Edit due date' },
    })

    await wrapper.get('button[aria-label="Close dialog"]').trigger('click')

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(wrapper.emitted('dismiss')).toEqual([['button']])
  })

  it('keeps the dialog visible while its closing animation runs', async () => {
    const wrapper = mount(AppDialog, {
      props: { open: true, title: 'Edit due date' },
    })

    await wrapper.setProps({ open: false })

    expect(wrapper.get('dialog').attributes()).toHaveProperty('open')
    expect(wrapper.get('dialog').classes()).toContain('app-dialog--closing')
    await new Promise((resolve) => window.setTimeout(resolve, 240))
    expect(wrapper.get('dialog').attributes()).not.toHaveProperty('open')
  })

  it('requests closing when Escape is pressed', async () => {
    const wrapper = mount(AppDialog, {
      props: { open: true, title: 'Edit due date' },
    })

    await wrapper.get('dialog').trigger('cancel')

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(wrapper.emitted('dismiss')).toEqual([['escape']])
  })

  it('prevents dismissal when configured as non-dismissible', async () => {
    const wrapper = mount(AppDialog, {
      props: {
        open: true,
        title: 'Required action',
        dismissible: false,
      },
    })

    expect(wrapper.find('.app-dialog__close').exists()).toBe(false)

    await wrapper.get('dialog').trigger('cancel')

    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })

  it('renders custom title and footer content', () => {
    const wrapper = mount(AppDialog, {
      props: { title: 'Fallback title' },
      slots: {
        title: 'Custom title',
        footer: '<button type="button">Save</button>',
      },
    })

    expect(wrapper.get('h2').text()).toBe('Custom title')
    expect(wrapper.get('footer button').text()).toBe('Save')
  })
})
