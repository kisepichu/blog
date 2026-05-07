import { readdirSync, readFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { load as yamlLoad } from 'js-yaml'

interface DefEntry {
  id: string
  title: string
  english: string
  aliases: string[]
  status: 'published' | 'draft' | 'scrap'
}
type AliasMap = Record<string, string> // alias/id → canonical id
type DefMetaMap = Record<string, { title: string; english: string }>

export type { DefEntry, AliasMap, DefMetaMap }

/**
 * content/defs/*.md を読み込み、frontmatter を解析して DefEntry (title・english 含む) と body を返す。
 * ディレクトリが存在しない場合は空配列を返す。
 * frontmatter は js-yaml でパースする。
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content }

  const parsed = yamlLoad(match[1])
  const frontmatter = (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed))
    ? (parsed as Record<string, unknown>)
    : {}

  return { frontmatter, body: match[2] }
}

export function scanDefsDirectory(dir: string): Array<DefEntry & { body: string }> {
  let files: string[]
  try {
    files = readdirSync(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }

  const result: Array<DefEntry & { body: string }> = []

  for (const file of files.sort()) {
    if (extname(file) !== '.md') continue

    const content = readFileSync(join(dir, file), 'utf-8')
    const { frontmatter, body } = parseFrontmatter(content)

    const id = String(frontmatter['id'] ?? basename(file, '.md'))
    const title = String(frontmatter['title'] ?? id)
    const rawEnglish = frontmatter['english']
    if (typeof rawEnglish !== 'string' || rawEnglish.trim() === '') {
      throw new Error(`Missing required frontmatter field "english" in ${join(dir, file)}`)
    }
    const english = rawEnglish.trim()
    const aliases = Array.isArray(frontmatter['aliases'])
      ? frontmatter['aliases'].map(String)
      : []
    const rawStatus = String(frontmatter['status'] ?? 'draft')
    const status = (['published', 'draft', 'scrap'].includes(rawStatus)
      ? rawStatus
      : 'draft') as 'published' | 'draft' | 'scrap'

    result.push({ id, title, english, aliases, status, body })
  }

  return result
}

export function buildDefMetaMap(defs: DefEntry[]): DefMetaMap {
  const map: DefMetaMap = Object.create(null) as DefMetaMap
  for (const def of defs) {
    map[def.id] = { title: def.title, english: def.english }
  }
  return map
}

export function buildAliasMap(defs: Array<Pick<DefEntry, 'id' | 'title' | 'aliases'>>): AliasMap {
  // null-prototype で prototype 汚染を防ぐ
  const map: AliasMap = Object.create(null) as AliasMap

  // アルファベット順に並べ替えることで、先勝ちロジックを id の辞書順で実現する
  const sorted = [...defs].sort((a, b) => a.id.localeCompare(b.id))

  for (const def of sorted) {
    const keys = [def.id, def.title, ...def.aliases]
    for (const key of keys) {
      if (Object.hasOwn(map, key)) {
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
