import { mergeAttributes, type NodeViewRendererProps } from '@tiptap/core'
import CodeBlock from '@tiptap/extension-code-block'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { tokenizeCode } from '@/lib/code-highlight'

export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'java', label: 'Java' },
]

export const DEFAULT_CODE_LANGUAGE = CODE_LANGUAGES[0].value

export const CodeBlockWithLanguage = CodeBlock.extend({
  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() ?? []

    return [
      ...parentPlugins,
      new Plugin({
        props: {
          decorations: state => {
            const decorations: Decoration[] = []

            state.doc.descendants((node, position) => {
              if (node.type.name !== this.name) return

              const language = node.attrs.language || DEFAULT_CODE_LANGUAGE
              let offset = 0

              tokenizeCode(node.textContent, language).forEach(token => {
                const from = position + 1 + offset
                const to = from + token.text.length

                if (token.className && from < to) {
                  decorations.push(Decoration.inline(from, to, { class: token.className }))
                }

                offset += token.text.length
              })
            })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
  addNodeView() {
    return ({ node, view, getPos }: NodeViewRendererProps) => {
      let currentNode = node
      const dom = document.createElement('div')
      const header = document.createElement('div')
      const select = document.createElement('select')
      const pre = document.createElement('pre')
      const code = document.createElement('code')

      const setLanguage = (language: string) => {
        dom.dataset.language = language
        pre.dataset.language = language
        code.className = `${this.options.languageClassPrefix}${language}`
        select.value = language
      }

      dom.className = 'editor-code-block'
      header.className = 'editor-code-header'
      header.contentEditable = 'false'
      select.className = 'editor-code-language-select'
      select.title = 'Code block language'

      CODE_LANGUAGES.forEach(language => {
        const option = document.createElement('option')
        option.value = language.value
        option.textContent = language.label
        select.append(option)
      })

      select.addEventListener('change', () => {
        const position = typeof getPos === 'function' ? getPos() : null
        if (typeof position !== 'number') return

        view.dispatch(
          view.state.tr.setNodeMarkup(position, undefined, {
            ...currentNode.attrs,
            language: select.value,
          })
        )
      })

      pre.contentEditable = 'true'
      code.contentEditable = 'true'
      header.append(select)
      pre.append(code)
      dom.append(header, pre)
      setLanguage(node.attrs.language || DEFAULT_CODE_LANGUAGE)

      return {
        dom,
        contentDOM: code,
        stopEvent: event => event.target === select || select.contains(event.target as Node),
        update: (updatedNode: ProseMirrorNode) => {
          if (updatedNode.type !== currentNode.type) return false
          currentNode = updatedNode
          setLanguage(updatedNode.attrs.language || DEFAULT_CODE_LANGUAGE)
          return true
        },
      }
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    const language = node.attrs.language || DEFAULT_CODE_LANGUAGE

    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-language': language,
      }),
      [
        'code',
        {
          class: `${this.options.languageClassPrefix}${language}`,
        },
        0,
      ],
    ]
  },
}).configure({
  defaultLanguage: DEFAULT_CODE_LANGUAGE,
  enableTabIndentation: true,
  tabSize: 2,
})
