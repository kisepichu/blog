import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { VFile } from 'vfile'

export default function remarkLocalDefinition() {
  return (tree: Root, file: VFile) => {
    // file.data.localIds を初期化
    if (!file.data.localIds) {
      file.data.localIds = new Set<string>()
    }
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (node.name !== 'definition') return
      const id = node.attributes?.id
      if (!id) return // id なし → remarkDefinitionBlock が処理するのでスキップ

      // localIds に追加
      ;(file.data.localIds as Set<string>).add(id)

      // hast プロパティを設定
      node.data = {
        hName: 'div',
        hProperties: { className: ['definition-block'], id },
      }
    })
  }
}
