import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { VFile } from 'vfile'
import { LOCAL_BLOCK_TYPES } from './local-block-config'

const LOCAL_BLOCK_MAP = new Map(LOCAL_BLOCK_TYPES.map((t) => [t.name, t]))

export default function remarkLocalBlock() {
  return (tree: Root, file: VFile) => {
    if (!file.data.localIds) {
      file.data.localIds = new Set<string>()
    }
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      const blockType = LOCAL_BLOCK_MAP.get(node.name)
      if (!blockType) return

      const id = node.attributes?.id
      if (!id) {
        console.warn(`[local-block] :::${node.name} には {#id} が必要です。変換をスキップします。`)
        return
      }

      ;(file.data.localIds as Set<string>).add(id)

      const rawTitle = node.attributes?.title
      const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : id

      node.data = {
        hName: 'div',
        hProperties: {
          className: [`${blockType.name}-block`],
          id,
          'data-block-title': title,
          ...(blockType.pagefindIgnore ? { 'data-pagefind-ignore': true } : {}),
        },
      }
    })
  }
}
