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
  top: number       // link.bottom + 8 (初期値。viewport 下端超えの場合は PopupItem 側で調整)
  anchorTop: number // link.top (viewport 下端超え時の反転計算に使用)
  zIndex: number
  isLocal: boolean  // ローカル定義の場合 true → MathJax を再実行しない
  term: string | undefined      // global concept-link の data-term (重複チェック用)
  localId: string | undefined   // local concept-link の data-local-id (重複チェック用)
}

let _popupIdCounter = 0

function nextPopupId(): number {
  return ++_popupIdCounter
}

const CONCEPT_LINK_SELECTOR =
  '.concept-link[data-term], [data-local-id].concept-link--local'

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
  // popup が DOM に追加された直後の mouseenter カスケードを抑制するフラグ
  // (新要素がカーソル下に現れるとブラウザが mouseenter を再発火し、連鎖増殖が起きるため)
  const suppressNewPopupRef = useRef(false)

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
      const toRemove = new Set<number>()
      const queue = [id]
      while (queue.length > 0) {
        const cur = queue.shift()!
        toRemove.add(cur)
        for (const p of popupsRef.current) {
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
      // popupsRef を同期更新してから setPopups (描画間の重複チェックを正確にするため)
      popupsRef.current = popupsRef.current.filter((p) => !toRemove.has(p.id))
      setPopups(popupsRef.current)
    },
    [],
  )

  // 全 popup を閉じる (Escape・外タップ用)
  const closeAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()
    popupsRef.current = []
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
        // preview-index.json と異なり、DOM から取得した HTML は remark/rehype パイプラインで
        // 生成された著者コンテンツ (MathJax 処理済み) なので既にレンダリング済み。
        // ユーザー入力は含まれない (XSS リスクなし)。
        html = target.innerHTML
        isLocal = true // DOM から取得: 既に MathJax レンダリング済みのため再実行不要
      } else {
        return null
      }

      // 既存 popup に同一 term / localId がある場合は重複作成をスキップ (Issue #32)
      // 祖先だけでなく全 popup を対象にすることで、親子関係の外側からの重複も防ぐ。
      // ただし既存 popup の close タイマーをキャンセルし、現在の linkEl をマッピングする。
      // (別リンク要素から同一 term を hover した際に、タイマー未キャンセルで popup が
      //  消えてしまうことを防ぐため)
      const duplicatePopup = popupsRef.current.find((p) => {
        if (term !== undefined) return p.term === term
        if (localId !== undefined) return p.localId === localId
        return false
      })
      if (duplicatePopup) {
        cancelTimer(duplicatePopup.id)
        getAncestorIds(duplicatePopup.id, popupsRef.current).forEach((aid) => cancelTimer(aid))
        linkPopupMapRef.current.set(linkEl, duplicatePopup.id)
        // 別リンク要素から hover した場合、popup の表示位置を現在のリンクに更新する
        const rect = linkEl.getBoundingClientRect()
        const popupWidth = 330
        const viewportPadding = 8
        const maxLeft = Math.max(viewportPadding, window.innerWidth - popupWidth - viewportPadding)
        const newLeft = Math.max(viewportPadding, Math.min(rect.left, maxLeft))
        const newTop = rect.bottom + 8
        const newAnchorTop = rect.top
        // parentId の更新: 新しい parentId が duplicatePopup 自身またはその子孫に
        // なる場合はサイクルが生じるため、元の parentId を維持する
        const newParentChain =
          parentPopupId !== null
            ? [parentPopupId, ...getAncestorIds(parentPopupId, popupsRef.current)]
            : []
        const safeParentId = newParentChain.includes(duplicatePopup.id)
          ? duplicatePopup.parentId
          : parentPopupId
        // 子孫 popup を全て閉じる: 親が別リンクへ移動するため、古い位置に取り残された
        // 子孫は孤立して不整合な表示になる
        const descendants = new Set<number>()
        const descQueue = popupsRef.current
          .filter((p) => p.parentId === duplicatePopup.id)
          .map((p) => p.id)
        while (descQueue.length > 0) {
          const cur = descQueue.shift()!
          descendants.add(cur)
          popupsRef.current
            .filter((p) => p.parentId === cur)
            .forEach((p) => descQueue.push(p.id))
        }
        descendants.forEach((did) => {
          const t = timersRef.current.get(did)
          if (t !== undefined) {
            clearTimeout(t)
            timersRef.current.delete(did)
          }
        })
        popupsRef.current = popupsRef.current
          .filter((p) => !descendants.has(p.id))
          .map((p) =>
            p.id === duplicatePopup.id
              ? { ...p, left: newLeft, top: newTop, anchorTop: newAnchorTop, parentId: safeParentId }
              : p,
          )
        setPopups(popupsRef.current)
        return duplicatePopup.id
      }

      const rect = linkEl.getBoundingClientRect()
      const popupWidth = 330
      const viewportPadding = 8
      const maxLeft = Math.max(viewportPadding, window.innerWidth - popupWidth - viewportPadding)
      const left = Math.max(viewportPadding, Math.min(rect.left, maxLeft))
      const top = rect.bottom + 8
      const anchorTop = rect.top
      const id = nextPopupId()
      // z-index: ベース 9000 + popup 生成順の id (hover 回数に応じて増加)
      const zIndex = 9000 + id

      // 親とその祖先のタイマーをキャンセル
      if (parentPopupId !== null) {
        cancelTimer(parentPopupId)
        getAncestorIds(parentPopupId, popupsRef.current).forEach((aid) => cancelTimer(aid))
      }

      // popupsRef を同期更新してから setPopups (描画間の重複チェックを正確にするため)
      popupsRef.current = [
        ...popupsRef.current,
        { id, parentId: parentPopupId, title, html, left, top, anchorTop, zIndex, isLocal, term, localId },
      ]
      setPopups(popupsRef.current)
      linkPopupMapRef.current.set(linkEl, id)

      // popup が DOM に追加された直後、カーソル下に現れた新要素への mouseenter を抑制する
      // (ブラウザは新要素出現時に mouseenter を再発火するため、連鎖増殖が起きる)
      suppressNewPopupRef.current = true
      setTimeout(() => { suppressNewPopupRef.current = false }, 0)

      return id
    },
    [cancelTimer, getAncestorIds],
  )

  // document.body へのイベント委譲
  useEffect(() => {
    function getClosestConceptLink(target: EventTarget | null): HTMLElement | null {
      if (!target || !(target instanceof Element)) return null
      return target.closest(CONCEPT_LINK_SELECTOR) as HTMLElement | null
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
          // popup が生きている: タイマーをキャンセルするだけ (抑制中でも閉じさせない)
          cancelTimer(existingId)
          getAncestorIds(existingId, popupsRef.current).forEach((aid) => cancelTimer(aid))
          return
        }
        // popup は既に閉じている: 古いマッピングを削除して新規表示へ
        linkPopupMapRef.current.delete(linkEl)
      }
      // popup 生成直後のカスケード抑制: 既存タイマーキャンセルは行うが新規 popup は作らない
      if (suppressNewPopupRef.current) return
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
      // 既存タイマーをクリアしてから新しくセット
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
        longPressActiveRef.current = false
      }
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
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
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

// popup prop が変わらない限り再レンダリングしない。
// 他の popup が追加・削除されたとき親が再レンダリングされても、既存 popup の
// dangerouslySetInnerHTML が再適用されて MathJax レンダリング済み innerHTML が
// 上書きリセットされるのを防ぐ。
const PopupItem = React.memo(function PopupItem({ popup }: PopupItemProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  // viewport 下端超え時にリンクの上に表示するため、top を調整する
  const [top, setTop] = useState(popup.top)

  useLayoutEffect(() => {
    // 別リンクから再利用されて popup.top が変化した場合、ローカル state をリセットしてから再判定する
    setTop(popup.top)
    const el = popupRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.bottom > window.innerHeight) {
      // anchorTop = link.top なので、popup をリンクの上に表示: link.top - popup高さ - 8px gap
      setTop(Math.max(8, popup.anchorTop - rect.height - 8))
    }
  }, [popup.top, popup.anchorTop])

  // global popup のみ MathJax を再実行 (local は DOM から取得した既レンダリング済みの HTML)
  // MathJax が async ロードで未初期化の場合があるため、最大 2 秒 (100ms × 20) ポーリングする
  useEffect(() => {
    if (popup.isLocal) return

    type MathJaxLike = {
      startup?: { promise?: Promise<unknown> }
      typesetPromise?: (els: Element[]) => Promise<void>
      typesetClear?: (els: Element[]) => void
    }

    let cancelled = false

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms)
      })

    const typesetWhenReady = async () => {
      const body = bodyRef.current
      if (!body) return

      for (let attempt = 0; attempt < 20 && !cancelled; attempt += 1) {
        const w = window as typeof window & { MathJax?: MathJaxLike }
        const mathJax = w.MathJax

        if (mathJax?.typesetPromise) {
          await mathJax.startup?.promise
          if (!cancelled) {
            await mathJax.typesetPromise([body])
            // typesetPromise 完了後に cancelled (= この effect が無効化済み) なら
            // MathJax の内部追跡から body を除去する。
            // これを行わないと、DOM から外れた body1 の状態が残り、
            // 後続 popup の typesetPromise 処理に干渉して TeX が壊れる。
            if (cancelled) {
              mathJax.typesetClear?.([body])
            }
          }
          return
        }

        await sleep(100)
      }
    }

    void typesetWhenReady()

    return () => {
      cancelled = true
    }
  }, [popup.isLocal, popup.html])

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
      {/* popup.html は remark/rehype パイプラインで生成された著者コンテンツ。ユーザー入力を含まない。 */}
      <div
        ref={bodyRef}
        className="hover-preview__body"
        dangerouslySetInnerHTML={{ __html: popup.html }}
      />
    </div>
  )
})
