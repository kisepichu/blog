import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { Plugin } from 'unified'
import type { VFile } from 'vfile'

export interface DefinitionBlockOptions {
  title?: string
  defTitleMap?: Record<string, string>
}

function resolveTitle(options: DefinitionBlockOptions, file: VFile): string | undefined {
  const explicitTitle = options.title?.trim()
  if (explicitTitle) return explicitTitle

  const path = file.path ?? ''
  const match = path.match(/(?:^|[/\\])([^/\\]+)\.md$/)
  if (!match) return undefined

  const title = options.defTitleMap?.[match[1]]?.trim()
  return title || undefined
}

const remarkDefinitionBlock: Plugin<[DefinitionBlockOptions?], Root> = (options = {}) => {
  return (tree: Root, file: VFile) => {
    const title = resolveTitle(options, file)
    let count = 0
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (node.name !== 'definition') return
      // id 属性があればスキップ (local-definition が処理する)
      if (node.attributes?.id) return
      count++
      const hProperties =
        count === 1
          ? {
              className: ['definition-block'],
              'data-pagefind-body': true,
              ...(title ? { 'data-def-title': title } : {}),
            }
          : { className: ['definition-block--extra'] }
      node.data = {
        hName: 'div',
        hProperties,
      }
      if (count > 1) console.warn('[definition-block] :::definition が複数あります')
    })
  }
}

export default remarkDefinitionBlock
