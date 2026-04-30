import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'

const ADMONITION_TYPES = new Set(['warning', 'info', 'tip', 'note'])

export default function remarkAdmonition() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (!ADMONITION_TYPES.has(node.name)) return
      node.data = {
        hName: 'div',
        hProperties: { className: ['admonition', `admonition--${node.name}`], 'data-pagefind-ignore': true },
      }
    })
  }
}
