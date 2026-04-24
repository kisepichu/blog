import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './HoverPreview.module.css'

interface Props {
  baseUrl?: string
}

interface PreviewEntry {
  title: string
  html: string
}

type PreviewIndex = Record<string, PreviewEntry>

interface PopupState {
  id: number
  parentId: number | null
  title: string
  html: string
  left: number
  top: number
  zIndex: number
  isLocal: boolean // ローカル定義の場合 true → MathJax を再実行しない
}

let _popupIdCounter = 0

function nextPopupId(): number {
  return ++_popupIdCounter
}

export default function HoverPreview({ baseUrl = '/' }: Props) {
  const [popups, setPopups] = useState<PopupState[]>([])
  // popup id → setTimeout handle
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const indexRef = useRef<PreviewIndex | null>(null)
  // concept-link element → popup id (そのリンクが開いた popup の id)
  const linkPopupMapRef = useRef<WeakMap<HTMLElement, number>>(new WeakMap())
  // 現在の popups の ref (イベントハンドラから最新の state を参照するため)
  const popupsRef = useRef<PopupState[]>([])
  popupsRef.current = popups
  // portal のコンテナ (document.body 直下の div)
  const portalContainerRef = useRef<HTMLDivElement | null>(null)
  // タッチ長押し用
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressActiveRef = useRef(false)

  // portal コンテナの作成・削除
  useEffect(() => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    portalContainerRef.current = container

    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
      portalContainerRef.current = null
    }
  }, [])

  // mount 時に preview-index.json を fetch してキャッシュ
  useEffect(() => {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    fetch(`${base}preview-index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data: PreviewIndex) => {
        indexRef.current = data
      })
      .catch(() => {
        // フェッチ失敗時は hover preview を無効化 (エラーにしない)
      })
  }, [baseUrl])

  // タイマーをキャンセルする
  const cancelTimer = useCallback((id: number) => {
    const t = timersRef.current.get(id)
    if (t !== undefined) {
      clearTimeout(t)
      timersRef.current.delete(id)
    }
  }, [])

  // 祖先の id 一覧を返す
  const getAncestorIds = useCallback(
    (id: number, currentPopups: PopupState[]): number[] => {
      const result: number[] = []
      let current = currentPopups.find((p) => p.id === id)
      while (current && current.parentId !== null) {
        result.push(current.parentId)
        current = currentPopups.find((p) => p.id === current!.parentId)
      }
      return result
    },
    [],
  )

  // popup を閉じる: 対象 id と全子孫を削除。タイマーも同時にキャンセルする
  const closePopup = useCallback(
    (id: number) => {
      setPopups((prev) => {
        const toRemove = new Set<number>()
        const queue = [id]
        while (queue.length > 0) {
          const cur = queue.shift()!
          toRemove.add(cur)
          for (const p of prev) {
            if (p.parentId === cur) queue.push(p.id)
          }
        }
        // 削除対象の全タイマーをキャンセル
        toRemove.forEach((rid) => {
          const t = timersRef.current.get(rid)
          if (t !== undefined) {
            clearTimeout(t)
            timersRef.current.delete(rid)
          }
        })
        return prev.filter((p) => !toRemove.has(p.id))
      })
    },
    [],
  )

  // 全 popup を閉じる (Escape・外タップ用)
  const closeAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()
    setPopups([])
  }, [])

  // popup に対して 180ms 後に閉じるタイマーをセット
  const scheduleClose = useCallback(
    (id: number) => {
      cancelTimer(id)
      const t = setTimeout(() => {
        timersRef.current.delete(id)
        closePopup(id)
      }, 180)
      timersRef.current.set(id, t)
    },
    [cancelTimer, closePopup],
  )

  // concept-link の hover/focus に応じて popup を表示する
  const showPopupForLink = useCallback(
    (linkEl: HTMLElement, parentPopupId: number | null): number | null => {
      const term = linkEl.dataset.term
      const localId = linkEl.dataset.localId

      let title = ''
      let html = ''
      let isLocal = false

      if (term) {
        const entry = indexRef.current?.[term]
        if (!entry) return null
        title = entry.title
        html = entry.html
      } else if (localId) {
        const target = document.getElementById(localId)
        if (!target) return null
        title = localId
        html = target.innerHTML
        isLocal = true // DOM から取得した local 定義: 既に MathJax レンダリング済み
      } else {
        return null
      }

      const rect = linkEl.getBoundingClientRect()
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 338))
      const top = rect.bottom + 8
      const id = nextPopupId()
      const zIndex = 9000 + id

      // 親とその祖先のタイマーをキャンセル
      if (parentPopupId !== null) {
        cancelTimer(parentPopupId)
        getAncestorIds(parentPopupId, popupsRef.current).forEach((aid) => cancelTimer(aid))
      }

      setPopups((prev) => [
        ...prev,
        { id, parentId: parentPopupId, title, html, left, top, zIndex, isLocal },
      ])
      linkPopupMapRef.current.set(linkEl, id)

      return id
    },
    [cancelTimer, getAncestorIds],
  )

  // document.body へのイベント委譲
  useEffect(() => {
    function getClosestConceptLink(target: EventTarget | null): HTMLElement | null {
      if (!target || !(target instanceof Element)) return null
      return target.closest(
        '.concept-link[data-term], [data-local-id].concept-link--local',
      ) as HTMLElement | null
    }

    function getClosestPopup(target: EventTarget | null): HTMLElement | null {
      if (!target || !(target instanceof Element)) return null
      return target.closest('.hover-preview') as HTMLElement | null
    }

    function getPopupId(el: HTMLElement): number | null {
      const id = el.dataset.popupId
      return id !== undefined ? Number(id) : null
    }

    function getParentPopupId(linkEl: HTMLElement): number | null {
      const popupEl = linkEl.closest('.hover-preview')
      if (!popupEl || !(popupEl instanceof HTMLElement)) return null
      return getPopupId(popupEl)
    }

    // リンクに対して popup を表示する (重複チェック込み)
    function tryShowLink(linkEl: HTMLElement) {
      const existingId = linkPopupMapRef.current.get(linkEl)
      if (existingId !== undefined) {
        const popupStillExists = popupsRef.current.some((p) => p.id === existingId)
        if (popupStillExists) {
          // popup が生きている: タイマーをキャンセルするだけ
          cancelTimer(existingId)
          getAncestorIds(existingId, popupsRef.current).forEach((aid) => cancelTimer(aid))
          return
        }
        // popup は既に閉じている: 古いマッピングを削除して新規表示へ
        linkPopupMapRef.current.delete(linkEl)
      }
      showPopupForLink(linkEl, getParentPopupId(linkEl))
    }

    // ── マウス ────────────────────────────────────────
    function onMouseEnter(e: MouseEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (linkEl) {
        tryShowLink(linkEl)
        return
      }
      const popupEl = getClosestPopup(e.target)
      if (popupEl) {
        const popupId = getPopupId(popupEl)
        if (popupId !== null) {
          cancelTimer(popupId)
          getAncestorIds(popupId, popupsRef.current).forEach((aid) => cancelTimer(aid))
        }
      }
    }

    function onMouseLeave(e: MouseEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (linkEl) {
        const popupId = linkPopupMapRef.current.get(linkEl)
        if (popupId !== undefined) scheduleClose(popupId)
        return
      }
      const popupEl = getClosestPopup(e.target)
      if (popupEl) {
        const popupId = getPopupId(popupEl)
        if (popupId !== null) scheduleClose(popupId)
      }
    }

    // ── タッチ (長押し 400ms でポップアップ表示) ──────
    function onTouchStart(e: TouchEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (!linkEl) return
      longPressTimerRef.current = setTimeout(() => {
        longPressActiveRef.current = true
        tryShowLink(linkEl)
      }, 400)
    }

    function onTouchEnd(e: TouchEvent) {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (longPressActiveRef.current) {
        // 長押しで popup を表示した: リンク遷移を防ぐ
        e.preventDefault()
        longPressActiveRef.current = false
        return
      }
      // 短タップ: popup 外なら全閉じ
      if (!getClosestConceptLink(e.target) && !getClosestPopup(e.target)) {
        closeAll()
      }
    }

    function onTouchMove() {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      longPressActiveRef.current = false
    }

    // ── キーボード (Tab フォーカス) ───────────────────
    function onFocus(e: FocusEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (linkEl) tryShowLink(linkEl)
    }

    function onBlur(e: FocusEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (linkEl) {
        const related = e.relatedTarget as Element | null
        // フォーカスが popup 内に移動した場合は閉じない
        if (related?.closest('.hover-preview')) return
        const popupId = linkPopupMapRef.current.get(linkEl)
        if (popupId !== undefined) scheduleClose(popupId)
        return
      }
      const popupEl = getClosestPopup(e.target)
      if (popupEl) {
        const related = e.relatedTarget as Element | null
        if (related?.closest('.hover-preview')) return
        const popupId = getPopupId(popupEl)
        if (popupId !== null) scheduleClose(popupId)
      }
    }

    // ── キーボード (Escape で全閉じ) ─────────────────
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll()
    }

    document.body.addEventListener('mouseenter', onMouseEnter, true)
    document.body.addEventListener('mouseleave', onMouseLeave, true)
    document.body.addEventListener('touchstart', onTouchStart, true)
    document.body.addEventListener('touchend', onTouchEnd, true)
    document.body.addEventListener('touchmove', onTouchMove, true)
    document.body.addEventListener('focus', onFocus, true)
    document.body.addEventListener('blur', onBlur, true)
    document.body.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.removeEventListener('mouseenter', onMouseEnter, true)
      document.body.removeEventListener('mouseleave', onMouseLeave, true)
      document.body.removeEventListener('touchstart', onTouchStart, true)
      document.body.removeEventListener('touchend', onTouchEnd, true)
      document.body.removeEventListener('touchmove', onTouchMove, true)
      document.body.removeEventListener('focus', onFocus, true)
      document.body.removeEventListener('blur', onBlur, true)
      document.body.removeEventListener('keydown', onKeyDown)
      // unmount 時に全タイマーをクリア
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [showPopupForLink, cancelTimer, scheduleClose, getAncestorIds, closeAll])

  const container = portalContainerRef.current
  if (!container) return null

  return createPortal(
    <>
      {popups.map((popup) => (
        <PopupItem key={popup.id} popup={popup} />
      ))}
    </>,
    container,
  )
}

interface PopupItemProps {
  popup: PopupState
}

function PopupItem({ popup }: PopupItemProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  // viewport 下端超え時にリンクの上に表示するため、top を調整する
  const [top, setTop] = useState(popup.top)

  useLayoutEffect(() => {
    const el = popupRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.bottom > window.innerHeight) {
      // popup.top = link.bottom + 8 なので、反転: link.bottom + 8 - height - 16 ≈ link.top - 8
      setTop(Math.max(8, popup.top - rect.height - 16))
    }
  }, [popup.top])

  // global popup のみ MathJax を再実行 (local は DOM から取得した既レンダリング済みの HTML)
  useEffect(() => {
    if (popup.isLocal) return
    const body = bodyRef.current
    if (!body) return
    const w = window as unknown as Record<string, unknown>
    const MathJax = w.MathJax as
      | { typesetPromise?: (els: Element[]) => Promise<void> }
      | undefined
    if (MathJax?.typesetPromise) {
      MathJax.typesetPromise([body])
    }
  }, [popup.isLocal])

  return (
    <div
      ref={popupRef}
      className={`hover-preview ${styles.popup}`}
      data-popup-id={String(popup.id)}
      style={{
        position: 'fixed',
        left: popup.left,
        top,
        zIndex: popup.zIndex,
      }}
    >
      <div className={`hover-preview__title ${styles.title}`}>{popup.title}</div>
      <div
        ref={bodyRef}
        className="hover-preview__body"
        dangerouslySetInnerHTML={{ __html: popup.html }}
      />
    </div>
  )
}
