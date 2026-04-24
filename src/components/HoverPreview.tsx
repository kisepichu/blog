import React, { useEffect, useRef, useCallback, useState } from 'react'
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
  // concept-link element → popup id (そのリンクが開いたpopupのid)
  const linkPopupMapRef = useRef<WeakMap<HTMLElement, number>>(new WeakMap())
  // 現在のpopupsのref (イベントハンドラから最新のstateを参照するため)
  const popupsRef = useRef<PopupState[]>([])
  popupsRef.current = popups
  // portal のコンテナ (document.body 直下の div)
  const portalContainerRef = useRef<HTMLDivElement | null>(null)

  // portal コンテナの作成・削除
  useEffect(() => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    portalContainerRef.current = container

    return () => {
      // body から安全に削除 (beforeEach/afterEach で body が変更されている可能性があるため)
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
      portalContainerRef.current = null
    }
  }, [])

  // mount 時に preview-index.json を fetch してキャッシュ
  useEffect(() => {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    const url = `${base}preview-index.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data: PreviewIndex) => {
        indexRef.current = data
      })
      .catch(() => {
        // フェッチ失敗時は何もしない
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

  // popup を閉じる: 対象 id と全子孫を削除
  const closePopup = useCallback((id: number) => {
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
      return prev.filter((p) => !toRemove.has(p.id))
    })
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
        const ancestors = getAncestorIds(parentPopupId, popupsRef.current)
        ancestors.forEach((aid) => cancelTimer(aid))
      }

      setPopups((prev) => [
        ...prev,
        { id, parentId: parentPopupId, title, html, left, top, zIndex },
      ])

      // link → popup id のマッピングを記録
      linkPopupMapRef.current.set(linkEl, id)

      return id
    },
    [cancelTimer, getAncestorIds],
  )

  // document.body へのイベント委譲 (capture phase で mouseenter/mouseleave を受け取る)
  useEffect(() => {
    function getClosestConceptLink(target: EventTarget | null): HTMLElement | null {
      if (!target || !(target instanceof Element)) return null
      const el = target.closest('.concept-link[data-term], [data-local-id].concept-link--local')
      return el as HTMLElement | null
    }

    function getClosestPopup(target: EventTarget | null): HTMLElement | null {
      if (!target || !(target instanceof Element)) return null
      const el = target.closest('.hover-preview')
      return el as HTMLElement | null
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

    function onMouseEnter(e: MouseEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (linkEl) {
        // このリンクが既に popup を持っているかチェック (重複防止)
        const existingId = linkPopupMapRef.current.get(linkEl)
        if (existingId !== undefined) {
          const popupStillExists = popupsRef.current.some((p) => p.id === existingId)
          if (popupStillExists) {
            // popup が生きている: タイマーをキャンセルするだけ
            cancelTimer(existingId)
            const ancestors = getAncestorIds(existingId, popupsRef.current)
            ancestors.forEach((aid) => cancelTimer(aid))
            return
          }
          // popup は既に閉じている: 古いマッピングを削除して新規表示へ
          linkPopupMapRef.current.delete(linkEl)
        }
        const parentPopupId = getParentPopupId(linkEl)
        showPopupForLink(linkEl, parentPopupId)
        return
      }

      const popupEl = getClosestPopup(e.target)
      if (popupEl) {
        const popupId = getPopupId(popupEl)
        if (popupId !== null) {
          cancelTimer(popupId)
          const ancestors = getAncestorIds(popupId, popupsRef.current)
          ancestors.forEach((aid) => cancelTimer(aid))
        }
      }
    }

    function onMouseLeave(e: MouseEvent) {
      const linkEl = getClosestConceptLink(e.target)
      if (linkEl) {
        const popupId = linkPopupMapRef.current.get(linkEl)
        if (popupId !== undefined) {
          scheduleClose(popupId)
        }
        return
      }

      const popupEl = getClosestPopup(e.target)
      if (popupEl) {
        const popupId = getPopupId(popupEl)
        if (popupId !== null) {
          scheduleClose(popupId)
        }
      }
    }

    document.body.addEventListener('mouseenter', onMouseEnter, true)
    document.body.addEventListener('mouseleave', onMouseLeave, true)

    return () => {
      document.body.removeEventListener('mouseenter', onMouseEnter, true)
      document.body.removeEventListener('mouseleave', onMouseLeave, true)
    }
  }, [showPopupForLink, cancelTimer, scheduleClose, getAncestorIds])

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

  // MathJax typeset
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    if (typeof window !== 'undefined') {
      const w = window as unknown as Record<string, unknown>
      const MathJax = w.MathJax as { typesetPromise?: (els: Element[]) => Promise<void> } | undefined
      if (MathJax?.typesetPromise) {
        MathJax.typesetPromise([body])
      }
    }
  }, [])

  return (
    <div
      className={`hover-preview ${styles.popup}`}
      data-popup-id={String(popup.id)}
      style={{
        position: 'fixed',
        left: popup.left,
        top: popup.top,
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
