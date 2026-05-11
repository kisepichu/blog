export interface LocalBlockType {
  name: string            // directive 名 (例: "theorem")
  label: string           // 表示ラベル (例: "定理")
  colorToken: string      // tokens.css のカラートークン名 (例: "lav")
  pagefindIgnore: boolean // true → data-pagefind-ignore 付与
}

export const LOCAL_BLOCK_TYPES: LocalBlockType[] = [
  { name: 'theorem',  label: '定理',  colorToken: 'lav',   pagefindIgnore: false },
  { name: 'example',  label: '例',    colorToken: 'sage',  pagefindIgnore: true  },
  { name: 'remark',   label: '注意',  colorToken: 'amber', pagefindIgnore: false },
  { name: 'notation', label: '記法',  colorToken: 'peach', pagefindIgnore: false },
]
