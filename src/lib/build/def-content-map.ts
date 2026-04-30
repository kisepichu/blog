import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkDefinitionBlock from '../remark/remark-definition-block'
import remarkConceptLink from '../remark/remark-concept-link'
import { extractDefinitionBlockHtml } from './extract-definition-block'
import type { AliasMap, DefMetaMap } from './alias-map'

export interface DefContentEntry {
  title: string
  html: string
}

export type DefContentMap = Record<string, DefContentEntry>

/**
 * 定義エントリの配列から、canonical id をキーとする DefContentMap を生成する。
 * 各エントリの body を remark パイプラインで処理し、
 * extractDefinitionBlockHtml で definition-block の inner HTML を抽出する。
 */
export async function buildDefContentMap(
  defs: Array<{ id: string; aliases: string[]; status: string; title: string; body: string }>,
  aliasMap: AliasMap,
  defMetaMap: DefMetaMap,
  baseUrl: string,
  isProd = false,
): Promise<DefContentMap> {
  const map: DefContentMap = Object.create(null) as DefContentMap

  for (const def of defs) {
    const html = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkDefinitionBlock)
      .use(remarkConceptLink, { aliasMap, defMetaMap, baseUrl, isProd })
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(def.body)
      .toString()

    const innerHtml = extractDefinitionBlockHtml(html)
    if (innerHtml === null) {
      console.warn(`[def-content-map] definition-block が見つかりません: "${def.id}"`)
      continue
    }

    map[def.id] = { title: def.title, html: innerHtml }
  }

  return map
}
