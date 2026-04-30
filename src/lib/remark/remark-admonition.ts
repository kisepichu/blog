import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'

const ADMONITION_LABELS: Record<string, string> = {
  warning: '⚠ 警告',
  info: 'ℹ 情報',
  tip: '💡 ヒント',
  note: '📝 注',
}

export default function remarkAdmonition() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (!(node.name in ADMONITION_LABELS)) return
      node.data = {
        hName: 'div',
        hProperties: { className: ['admonition', `admonition--${node.name}`], 'data-pagefind-ignore': true },
      }
      // ラベル span を先頭に挿入してスクリーンリーダーに種別を伝える
      node.children.unshift({
        type: 'paragraph',
        data: { hName: 'span', hProperties: { className: ['admonition__label'], 'aria-hidden': true } },
        children: [{ type: 'text', value: ADMONITION_LABELS[node.name] }],
      })
    })
  }
}
