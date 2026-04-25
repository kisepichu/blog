import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './SearchInterface.module.css'

interface Props {
  initialQuery: string
  baseUrl: string
}

interface FilterChip {
  kind: 'tag' | 'type'
  value: string
}

interface PagefindResult {
  url: string
  meta: {
    title?: string
    type?: string
    date?: string
    tags?: string
    aliases?: string
  }
  excerpt: string
}

interface PagefindFilters {
  tags?: Record<string, number>
  type?: Record<string, number>
}

interface PagefindModule {
  init: () => Promise<void>
  filters: () => Promise<PagefindFilters>
  // query に null を渡すと filter-only search になる (空文字列は 0 件で終了するため)
  search: (
    query: string | null,
    options?: { filters?: Record<string, string[]> },
  ) => Promise<{ results: Array<{ data: () => Promise<PagefindResult> }> }>
}

/** initialQuery が `#tag` / `@type` の場合は chip として解釈し、残りをテキストとして返す */
function parseInitialQuery(q: string): { chips: FilterChip[]; text: string } {
  if (q.startsWith('#')) {
    const tag = q.slice(1).trim()
    if (tag) return { chips: [{ kind: 'tag', value: tag }], text: '' }
  }
  if (q.startsWith('@')) {
    const type = q.slice(1).trim()
    if (type) return { chips: [{ kind: 'type', value: type }], text: '' }
  }
  return { chips: [], text: q }
}

export default function SearchInterface({ initialQuery, baseUrl }: Props) {
  // HoverPreview と同様にトレイリングスラッシュを正規化する
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  const { chips: initialChips, text: initialText } = parseInitialQuery(initialQuery)
  const [inputValue, setInputValue] = useState(initialText)
  const [chips, setChips] = useState<FilterChip[]>(initialChips)
  const [dropdown, setDropdown] = useState<string[] | null>(null)
  const [dropdownKind, setDropdownKind] = useState<'tag' | 'type' | null>(null)
  const [dropdownIndex, setDropdownIndex] = useState<number>(-1)
  const [results, setResults] = useState<PagefindResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [pagefindError, setPagefindError] = useState(false)

  const pagefindRef = useRef<PagefindModule | null>(null)
  const pagefindPromiseRef = useRef<Promise<PagefindModule | null> | null>(null)
  const allFiltersRef = useRef<PagefindFilters | null>(null)
  // race condition 防止: 非同期 getFilters 完了時に入力値が変わっていないか照合する
  const inputValueRef = useRef(initialText)
  // chip 選択後に input に残すテキスト (inline prefix: "poset #型" → prefix = "poset")
  const dropdownPrefixRef = useRef<string>('')

  // 静的サイトでは Astro.url.searchParams がビルド時に空のため、
  // マウント時に window.location.search から初期クエリを読み取る
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    if (!q || q === initialQuery) return
    const { chips: parsedChips, text } = parseInitialQuery(q)
    setInputValue(text)
    inputValueRef.current = text
    if (parsedChips.length > 0) setChips(parsedChips)
  }, [initialQuery])

  // Pagefind の初期化
  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<PagefindModule | null> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = (await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`)) as any
        const pf: PagefindModule = mod.default ?? mod
        await pf.init()
        if (!cancelled) {
          pagefindRef.current = pf
        }
        return pf
      } catch {
        if (!cancelled) {
          setPagefindError(true)
        }
        return null
      }
    }
    const promise = load()
    pagefindPromiseRef.current = promise
    void promise
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  // pagefind モジュールを取得する (初期化完了を待つ)
  const getPagefind = useCallback(async (): Promise<PagefindModule | null> => {
    if (pagefindRef.current) return pagefindRef.current
    if (pagefindPromiseRef.current) return pagefindPromiseRef.current
    return null
  }, [])

  // フィルタを取得する (キャッシュ優先、なければ pagefind から取得)
  const getFilters = useCallback(async (): Promise<PagefindFilters> => {
    if (allFiltersRef.current) return allFiltersRef.current
    const pf = await getPagefind()
    if (!pf) return {}
    try {
      const f = await pf.filters()
      allFiltersRef.current = f
      return f
    } catch {
      setPagefindError(true)
      return {}
    }
  }, [getPagefind])

  // 入力変化でドロップダウン制御
  // "poset #型" のように検索ワードの後に inline で # / @ を入力した場合も対応する
  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      inputValueRef.current = val

      // 末尾に #<partial> または @<partial> が続くパターンを検出
      const tagMatch = val.match(/^(.*?)#(\S*)$/)
      const typeMatch = !tagMatch && val.match(/^(.*?)@(\S*)$/)

      if (tagMatch) {
        const prefix = tagMatch[1].trimEnd()
        const partial = tagMatch[2]
        dropdownPrefixRef.current = prefix
        const allFilters = await getFilters()
        // 非同期完了後に入力値が変わっていれば破棄 (race condition 防止)
        if (inputValueRef.current !== val) return
        const tags = allFilters?.tags ? Object.keys(allFilters.tags) : []
        const filtered = partial === '' ? tags : tags.filter((t) => t.includes(partial))
        setDropdown(filtered)
        setDropdownKind('tag')
      } else if (typeMatch) {
        const prefix = typeMatch[1].trimEnd()
        const partial = typeMatch[2]
        dropdownPrefixRef.current = prefix
        const allFilters = await getFilters()
        if (inputValueRef.current !== val) return
        const types = allFilters?.type ? Object.keys(allFilters.type) : []
        const filtered = partial === '' ? types : types.filter((t) => t.includes(partial))
        setDropdown(filtered)
        setDropdownKind('type')
      } else {
        dropdownPrefixRef.current = ''
        setDropdown(null)
        setDropdownKind(null)
      }
    },
    [getFilters],
  )

  // 候補クリックで chip 追加
  const handleCandidateClick = useCallback(
    (value: string, kind: 'tag' | 'type') => {
      setChips((prev) => {
        if (kind === 'type') {
          // type chip は最大 1 つ (上書き)
          return [...prev.filter((c) => c.kind !== 'type'), { kind: 'type', value }]
        }
        // タグ chip: 重複しなければ追加
        if (prev.some((c) => c.kind === 'tag' && c.value === value)) return prev
        return [...prev, { kind: 'tag', value }]
      })
      const prefix = dropdownPrefixRef.current
      dropdownPrefixRef.current = ''
      setInputValue(prefix)
      inputValueRef.current = prefix  // stale な非同期ドロップダウン更新を破棄させる
      setDropdown(null)
      setDropdownKind(null)
      setDropdownIndex(-1)
    },
    [],
  )

  // dropdown 変化時にアクティブインデックスをリセット
  useEffect(() => {
    setDropdownIndex(-1)
  }, [dropdown])

  // キーボード操作: ArrowDown/Up で候補選択、Enter で確定、Backspace で chip 削除
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (dropdown && dropdown.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setDropdownIndex((i) => (i + 1) % dropdown.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setDropdownIndex((i) => (i <= 0 ? dropdown.length - 1 : i - 1))
          return
        }
        if (e.key === 'Enter' && dropdownKind) {
          e.preventDefault()
          const selected = dropdownIndex >= 0 ? dropdown[dropdownIndex] : dropdown[0]
          handleCandidateClick(selected, dropdownKind)
          return
        }
      }
      // input が空、またはカーソルが先頭にある状態で Backspace を押すと末尾 chip を削除
      if (
        e.key === 'Backspace' &&
        chips.length > 0 &&
        e.currentTarget.selectionStart === 0 &&
        e.currentTarget.selectionEnd === 0
      ) {
        setChips((prev) => prev.slice(0, -1))
      }
    },
    [dropdown, dropdownIndex, dropdownKind, handleCandidateClick, inputValue, chips],
  )

  // chip 削除
  const removeChip = useCallback((index: number) => {
    setChips((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // 検索実行 (300ms デバウンス付き)
  useEffect(() => {
    const tagMatch = inputValue.match(/^(.*?)#\S*$/)
    const typeMatch = !tagMatch && inputValue.match(/^(.*?)@\S*$/)
    const queryText = tagMatch
      ? tagMatch[1].trimEnd()
      : typeMatch
        ? typeMatch[1].trimEnd()
        : inputValue
    const typeFilter = chips.find((c) => c.kind === 'type')?.value ?? null
    const tagFilters = chips.filter((c) => c.kind === 'tag').map((c) => c.value)

    if (queryText === '' && !typeFilter && tagFilters.length === 0) {
      setLoading(false)
      setResults(null)
      return
    }

    let cancelled = false
    const run = async () => {
      const pf = await getPagefind()
      if (!pf || cancelled) return
      setLoading(true)
      try {
        // queryText が空の場合は null を渡す (filter-only search)
        // 空文字列を渡すと Pagefind が 0 件で早期終了するため
        const res = await pf.search(queryText || null, {
          filters: {
            ...(typeFilter && { type: [typeFilter] }),
            ...(tagFilters.length > 0 && { tags: tagFilters }),
          },
        })
        const data = await Promise.all(res.results.slice(0, 20).map((r) => r.data()))
        if (!cancelled) {
          setResults(data)
        }
      } catch (err) {
        console.error('Pagefind search failed', err)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const timer = setTimeout(() => { void run() }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [inputValue, chips, getPagefind])

  if (pagefindError) {
    return (
      <div className={styles.error}>
        検索インデックスが見つかりません (build 後に利用可能)
      </div>
    )
  }

  const renderTagMatch = inputValue.match(/^(.*?)#\S*$/)
  const renderTypeMatch = !renderTagMatch && inputValue.match(/^(.*?)@\S*$/)
  const queryText = renderTagMatch
    ? renderTagMatch[1].trimEnd()
    : renderTypeMatch
      ? renderTypeMatch[1].trimEnd()
      : inputValue
  const typeFilter = chips.find((c) => c.kind === 'type')?.value ?? null
  const tagFilters = chips.filter((c) => c.kind === 'tag').map((c) => c.value)

  return (
    <div className={styles.container} data-search-interface>
      {/* chip 一覧 */}
      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((chip, i) => (
            <span
              key={`${chip.kind}-${chip.value}`}
              data-filter-chip
              {...(chip.kind === 'type' ? { 'data-filter-chip-type': 'type' } : {})}
              className={styles.chip}
            >
              {chip.value}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => removeChip(i)}
                aria-label={`${chip.value} を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 入力欄 + ドロップダウン (ドロップダウンを input 直下に配置するためラップ) */}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="検索… (#タグ, @type, またはフリーワード)"
          aria-label="検索"
          data-search-input
        />

        {/* ドロップダウン */}
        {dropdown !== null && dropdown.length > 0 && (
          <ul data-dropdown className={styles.dropdown}>
            {dropdown.map((item, idx) => (
              <li key={item}>
                <button
                  type="button"
                  className={
                    idx === dropdownIndex
                      ? `${styles.dropdownItem} ${styles.dropdownItemActive}`
                      : styles.dropdownItem
                  }
                  onClick={() => handleCandidateClick(item, dropdownKind!)}
                  aria-selected={idx === dropdownIndex}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 検索結果 */}
      {loading && (
        <div className={styles.results}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {!loading && results !== null && (
        <div className={styles.results}>
          {results.length === 0 ? (
            <p className={styles.noResults}>
              &ldquo;{queryText || [...tagFilters, typeFilter].filter(Boolean).join(', ')}&rdquo; に一致する結果が見つかりませんでした
            </p>
          ) : (
            <>
              <p className={styles.count}>{results.length} 件の結果</p>
              {results.map((result) => {
                if (result.meta?.type === 'post') {
                  return <SearchResultPost key={result.url} result={result} />
                }
                return <SearchResultDef key={result.url} result={result} />
              })}
            </>
          )}
        </div>
      )}

    </div>
  )
}

interface ResultProps {
  result: PagefindResult
}

function SearchResultPost({ result }: ResultProps) {
  return (
    <div className={styles.resultItem}>
      <a href={result.url} className={styles.resultTitle}>
        {result.meta?.title ?? '(無題)'}
      </a>
      {result.meta?.date && (
        <span className={styles.resultDate}>{result.meta.date}</span>
      )}
      {result.meta?.tags && (
        <span className={styles.resultTags}>{result.meta.tags}</span>
      )}
      <div
        className={styles.resultExcerpt}
        dangerouslySetInnerHTML={{ __html: result.excerpt }}
      />
    </div>
  )
}

function SearchResultDef({ result }: ResultProps) {
  return (
    <div className={styles.resultItem}>
      <a href={result.url} className={styles.resultTitle}>
        {result.meta?.title ?? '(無題)'}
      </a>
      {result.meta?.aliases && (
        <span className={styles.resultAliases}>{result.meta.aliases}</span>
      )}
      <div
        className={styles.resultExcerpt}
        dangerouslySetInnerHTML={{ __html: result.excerpt }}
      />
    </div>
  )
}
