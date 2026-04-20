import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'

export default function remarkDefinitionBlock() {
  return (tree: Root) => {
    let count = 0
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (node.name !== 'definition') return
      // id 属性があればスキップ (local-definition が処理する)
      if (node.attributes?.id) return
      count++
      node.data = {
        hName: 'div',
        hProperties: {
          className: count === 1 ? ['definition-block'] : ['definition-block--extra'],
        },
      }
      if (count > 1) console.warn('[definition-block] :::definition が複数あります')
    })
  }
}
