import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './HeaderSearch.module.css'

interface Props {
  baseUrl: string
}

interface PagefindFilters {
  tags?: Record<string, number>
  type?: Record<string, number>
}

interface PagefindModule {
  init: () => Promise<void>
  filters: () => Promise<PagefindFilters>
  search: (query: string | null) => Promise<unknown>
}

export default function HeaderSearch({ baseUrl }: Props) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const [inputValue, setInputValue] = useState('')
  const [dropdown, setDropdown] = useState<string[] | null>(null)
  const [dropdownKind, setDropdownKind] = useState<'tag' | 'type' | null>(null)
  const [dropdownIndex, setDropdownIndex] = useState(-1)

  const pagefindRef = useRef<PagefindModule | null>(null)
  const pagefindPromiseRef = useRef<Promise<PagefindModule | null> | null>(null)
  const allFiltersRef = useRef<PagefindFilters | null>(null)
  const inputValueRef = useRef('')
  const dropdownPrefixRef = useRef('')

  // URL の ?q= をマウント時に反映 (静的サイト向け)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    if (!q) return
    setInputValue(q)
    inputValueRef.current = q
  }, [])

  // Pagefind 初期化 (dev 環境ではエラーになるが無視 — ドロップダウン非表示になるだけ)
  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<PagefindModule | null> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = (await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`)) as any
        const pf: PagefindModule = mod.default ?? mod
        await pf.init()
        if (!cancelled) pagefindRef.current = pf
        return pf
      } catch {
        return null
      }
    }
    const promise = load()
    pagefindPromiseRef.current = promise
    void promise
    return () => { cancelled = true }
  }, [base])

  const getPagefind = useCallback(async (): Promise<PagefindModule | null> => {
    if (pagefindRef.current) return pagefindRef.current
    if (pagefindPromiseRef.current) return pagefindPromiseRef.current
    return null
  }, [])

  const getFilters = useCallback(async (): Promise<PagefindFilters> => {
    if (allFiltersRef.current) return allFiltersRef.current
    const pf = await getPagefind()
    if (!pf) return {}
    try {
      const f = await pf.filters()
      allFiltersRef.current = f
      return f
    } catch {
      return {}
    }
  }, [getPagefind])

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      inputValueRef.current = val

      const tagMatch = val.match(/^(.*?)#(\S*)$/)
      const typeMatch = !tagMatch && val.match(/^(.*?)@(\S*)$/)

      if (tagMatch) {
        const prefix = tagMatch[1].trimEnd()
        const partial = tagMatch[2]
        dropdownPrefixRef.current = prefix
        const allFilters = await getFilters()
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

  useEffect(() => { setDropdownIndex(-1) }, [dropdown])

  const navigate = useCallback(
    (query: string) => {
      window.location.href = `${base}search?q=${encodeURIComponent(query)}`
    },
    [base],
  )

  const handleCandidateClick = useCallback(
    (value: string, kind: 'tag' | 'type') => {
      const prefix = dropdownPrefixRef.current
      const token = kind === 'tag' ? `#${value}` : `@${value}`
      const newVal = prefix ? `${prefix} ${token}` : token
      setInputValue(newVal)
      inputValueRef.current = newVal
      setDropdown(null)
      setDropdownKind(null)
      setDropdownIndex(-1)
    },
    [],
  )

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
        if (e.key === 'Escape') {
          setDropdown(null)
          setDropdownKind(null)
          return
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        navigate(inputValue)
      }
    },
    [dropdown, dropdownIndex, dropdownKind, handleCandidateClick, inputValue, navigate],
  )

  const isExpanded = dropdown !== null && dropdown.length > 0

  return (
    <div className={styles.wrapper} data-header-search>
      <input
        role="combobox"
        type="search"
        className={styles.input}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="search..."
        aria-label="検索"
        aria-autocomplete="list"
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? 'header-search-listbox' : undefined}
        aria-activedescendant={
          isExpanded && dropdownIndex >= 0
            ? `header-search-option-${encodeURIComponent(dropdown[dropdownIndex])}`
            : undefined
        }
        autoComplete="off"
        data-header-search-input
      />
      {isExpanded && (
        <ul id="header-search-listbox" role="listbox" className={styles.dropdown}>
          {dropdown.map((item, idx) => (
            <li
              key={item}
              id={`header-search-option-${encodeURIComponent(item)}`}
              role="option"
              aria-selected={idx === dropdownIndex}
              className={
                idx === dropdownIndex
                  ? `${styles.dropdownItem} ${styles.dropdownItemActive}`
                  : styles.dropdownItem
              }
              onClick={() => handleCandidateClick(item, dropdownKind!)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
