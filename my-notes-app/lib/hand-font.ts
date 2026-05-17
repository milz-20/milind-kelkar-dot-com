import { Mark, mergeAttributes } from '@tiptap/core'

export const HandFont = Mark.create({
  name: 'handFont',

  parseHTML() {
    return [
      {
        tag: 'span[data-hand-font]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'hand-font',
        'data-hand-font': '',
      }),
      0,
    ]
  },
})
