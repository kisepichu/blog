import { readdirSync, readFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

interface DefEntry {
  id: string
  aliases: string[]
  status: 'published' | 'draft' | 'scrap'
}
type AliasMap = Record<string, string> // alias/id → canonical id

export type { DefEntry, AliasMap }

/**
 * content/defs/*.md を読み込み、frontmatter を解析して DefEntry + title + body を返す。
 * ディレクトリが存在しない場合は空配列を返す。
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content }

  const fm: Record<string, unknown> = {}
  const body = match[2]
  const lines = match[1].split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const colonIdx = line.indexOf(':')
    if (colonIdx < 0) { i++; continue }

    const key = line.slice(0, colonIdx).trim()
    const rest = line.slice(colonIdx + 1).trim()

    if (rest.startsWith('[')) {
      // インライン配列: [a, b, c]
      const inner = rest.slice(1, rest.lastIndexOf(']'))
      fm[key] = inner.length > 0 ? inner.split(',').map(s => s.trim()) : []
    } else if (rest === '') {
      // ブロック配列:
      //   - item1
      //   - item2
      const arr: string[] = []
      i++
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        arr.push(lines[i].replace(/^\s+-\s+/, '').trim())
        i++
      }
      fm[key] = arr
      continue
    } else {
      fm[key] = rest
    }
    i++
  }

  return { frontmatter: fm, body }
}

export function scanDefsDirectory(dir: string): Array<DefEntry & { title: string; body: string }> {
  let files: string[]
  try {
    files = readdirSync(dir)
  } catch {
    return []
  }

  const result: Array<DefEntry & { title: string; body: string }> = []

  for (const file of files.sort()) {
    if (extname(file) !== '.md') continue

    const content = readFileSync(join(dir, file), 'utf-8')
    const { frontmatter, body } = parseFrontmatter(content)

    const id = String(frontmatter['id'] ?? basename(file, '.md'))
    const title = String(frontmatter['title'] ?? id)
    const aliases = Array.isArray(frontmatter['aliases'])
      ? frontmatter['aliases'].map(String)
      : []
    const rawStatus = String(frontmatter['status'] ?? 'draft')
    const status = (['published', 'draft', 'scrap'].includes(rawStatus)
      ? rawStatus
      : 'draft') as 'published' | 'draft' | 'scrap'

    result.push({ id, title, aliases, status, body })
  }

  return result
}

export function buildAliasMap(defs: DefEntry[]): AliasMap {
  const map: AliasMap = {}

  // アルファベット順に並べ替えることで、先勝ちロジックを id の辞書順で実現する
  const sorted = [...defs].sort((a, b) => a.id.localeCompare(b.id))

  for (const def of sorted) {
    const keys = [def.id, ...def.aliases]
    for (const key of keys) {
      if (key in map) {
        console.warn(
          `[alias-map] alias "${key}" is already registered for "${map[key]}", skipping "${def.id}"`,
        )
      } else {
        map[key] = def.id
      }
    }
  }

  return map
}
