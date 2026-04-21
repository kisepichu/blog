import tagColorsConfig from '../config/tag-colors.json'

export interface TagColor {
  bg: string
  fg: string
  border: string
}

// パステルカラーのキー一覧 (index 0..4)
const PASTEL_KEYS = ['lav', 'peach', 'rose', 'sage', 'amber'] as const
type PastelKey = (typeof PASTEL_KEYS)[number]

function pastelKeyToColor(key: PastelKey): TagColor {
  return {
    bg: `var(--${key}-bg)`,
    fg: `var(--${key})`,
    border: `var(--${key}-b)`,
  }
}

/**
 * タグ文字列から CSS var() 形式の色オブジェクトを返す。
 * - 設定ファイルに存在するタグは対応する色を返す
 * - 未知のタグは charCode の合計 % 5 で決定論的に色を選択
 */
export function getTagColor(tag: string): TagColor {
  const config = tagColorsConfig as Record<string, string>
  if (Object.prototype.hasOwnProperty.call(config, tag)) {
    const key = config[tag] as PastelKey
    return pastelKeyToColor(key)
  }

  // 決定論的ハッシュ: charCodeAt の合計 % 5
  let sum = 0
  for (let i = 0; i < tag.length; i++) {
    sum += tag.charCodeAt(i)
  }
  const index = sum % 5
  return pastelKeyToColor(PASTEL_KEYS[index])
}
