/* ═══════════════════════════════════════════════════════════════════════════
   THE LIBRARY — /assets

   What this used to be: a numbered `Band` hanging off a zero-padded gutter,
   with no heading anywhere, and its filter row portalled into the left rail —
   a rail that, per principle 11, is WHERE YOU ARE and never what you are
   looking at. The rail is now free of this screen's controls; the type filter
   sits directly above the grid it filters.

   What it is now:
     1  A real <h1>. The screen says what it is.
     2  The media is the hero. `.grid-media` + `.thumb`, and the CARD ASPECT
        FOLLOWS THE MEDIA ASPECT (principle 6). metadata_json is the first
        source; where the backend never wrote one — which is most rows, the
        column is nullable and generation_service does not populate it — the
        true ratio is measured off the decoded frame (naturalWidth /
        videoWidth) and the tile settles to 16:9, 9:16 or 1:1. Nothing is
        cropped and nothing is forced square.
     3  THREE FACTS under a thumbnail (principle 7): kind, status, date.
        Provider, model, pixel dimensions, duration, file name and the
        reference-preview flag live in the DETAILS PANEL for the SELECTED item
        only, on the far end, where principle 11 puts them.
     4  STATUS IS A FIELD (principle 5). `.st` with a word: an asset whose URL
        is missing, or whose media fails to decode, reads "Unavailable". No
        gauge, no glow — the old page ran an indeterminate Meter while loading.

   EVERY FEATURE OF THE PREVIOUS PAGE IS STILL HERE: type filtering with live
   counts, the lightbox, download, delete behind ConfirmDialog, the empty
   state, the error state with retry, and the `.stow` row actions — which stay
   reachable by keyboard (:focus-within) and are ALWAYS visible on a coarse
   pointer, because a tablet has no hover and a hidden delete is no delete.

   ADDED, AND WIRED: assetService already returned `has_more` and `total` and
   the page threw them away, so a library past the page size was unreachable.
   There is now a real "Load more" that appends the next page, and it is drawn
   only when the server says there is one.

   NOTHING IS GATED ON A LOADING FLAG THAT REPLACES THE PAGE. The heading, the
   filter and the actions render on the first paint; only the grid carries
   skeletons, and they use `.skel`, which does not pulse.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assetService } from '../services/assetService'
import { useUIStore } from '../store/uiStore'
import { Strike, Download, Revise, Expand, Close, AudioMark } from '../components/Icon'
import { useLightbox } from '../components/MediaLightbox'
import ConfirmDialog from '../components/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

/* The backend caps `limit` at 100 (routes_assets.py). 48 fills the first
   screen quickly and leaves the pager something honest to do. */
const PAGE_SIZE = 48

/* ── READING THE OBJECT ────────────────────────────────────────────────────
   The list endpoint serialises the metadata column as `metadata` and the
   column is TEXT, so it arrives as a JSON *string* when it arrives at all.
   Both shapes and the absent case are handled; nothing here assumes a key. */
function metaOf(asset) {
  const raw = asset?.metadata_json ?? asset?.metadata
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

const kindFromRatio = (r) => (r >= 1.15 ? 'wide' : r <= 0.87 ? 'tall' : 'square')

/* Principle 6 — the declared aspect, before a single pixel has decoded. */
function declaredKind(meta) {
  const a = meta.aspect_ratio || meta.aspectRatio
  if (typeof a === 'string' && a.includes(':')) {
    const [w, h] = a.split(':').map(Number)
    if (w > 0 && h > 0) return kindFromRatio(w / h)
  }
  if (meta.orientation === 'vertical' || meta.orientation === 'portrait') return 'tall'
  if (meta.orientation === 'square') return 'square'
  const w = Number(meta.width)
  const h = Number(meta.height)
  if (w > 0 && h > 0) return kindFromRatio(w / h)
  return 'wide'
}

const urlOf = (asset) => asset?.url || asset?.public_url || asset?.storage_url || ''

function fileNameOf(url) {
  try {
    const path = new URL(url, window.location.origin).pathname
    const last = path.split('/').filter(Boolean).pop()
    const name = last ? decodeURIComponent(last) : ''
    /* `/api/assets/{id}/file` is a route, not a file name. Only something
       with an extension is worth showing as one. */
    return name.includes('.') ? name : ''
  } catch (_) {
    return ''
  }
}

/* A3 — dates, timecodes and resolutions are Latin runs inside an Arabic one
   and every one of them is printed inside .mono. */
function fmtDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/* A3 — every figure is isolated in .mono, or the bidi algorithm reorders the
   run and strands the separator between two numbers in an Arabic sentence. */
const N = ({ v }) => <span className="mono">{v}</span>

function fmtClock(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/* ── THE TILE ──────────────────────────────────────────────────────────────
   The wrapper carries `.group` and the row actions; the button carries the
   media. They are siblings, never nested — a control inside a control is
   invalid markup and the browser drops one of them. */
function AssetTile({ asset, ar, selected, probe, onSelect, onOpen, onProbe, onBroken, labels }) {
  const url = urlOf(asset)
  const type = String(asset.asset_type || '').toLowerCase()
  const meta = metaOf(asset)
  const kind = probe?.kind || declaredKind(meta)
  const viewable = (type === 'image' || type === 'video') && !!url
  const dead = !url || probe?.broken

  const title =
    asset.filename ||
    asset.prompt ||
    meta.prompt ||
    meta.title ||
    fileNameOf(url) ||
    (ar ? 'بدون عنوان' : 'Untitled')

  const typeWord = labels.kind[type] || (ar ? 'ملف' : 'File')
  const clock = fmtClock(probe?.duration ?? Number(meta.duration))

  return (
    <div
      className="tile group"
      style={{
        position: 'relative',
        borderColor: selected ? 'var(--accent)' : undefined,
        boxShadow: selected ? 'inset 0 0 0 1px var(--accent)' : undefined,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(asset)}
        /* Single click selects and fills the details panel; double click is
           the trade's accelerator into the viewer. Neither is the only way
           in — the expand mark below does it in one press, on any device. */
        onDoubleClick={viewable ? () => onOpen(asset) : undefined}
        aria-pressed={selected}
        title={title}
        style={{ display: 'block', inlineSize: '100%', textAlign: 'start' }}
      >
        <div className={`thumb thumb--${kind}`}>
          {type === 'image' && url ? (
            <img
              src={url}
              alt=""
              loading="lazy"
              onLoad={(e) => onProbe(asset.id, { w: e.target.naturalWidth, h: e.target.naturalHeight })}
              onError={() => onBroken(asset.id)}
            />
          ) : type === 'video' && url ? (
            /* preload="metadata" buys the poster frame, the true dimensions
               and the duration without pulling the clip. A grid of playing
               videos is a bandwidth bill. */
            <video
              src={url}
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => onProbe(asset.id, {
                w: e.target.videoWidth,
                h: e.target.videoHeight,
                duration: e.target.duration,
              })}
              onError={() => onBroken(asset.id)}
            />
          ) : (
            <span style={{ color: 'var(--on-well-2)', display: 'grid', placeItems: 'center', gap: 6 }}>
              <AudioMark size={22} />
              <span style={{ fontSize: 11 }}>{typeWord}</span>
            </span>
          )}
          {clock && <span className="dur mono">{clock}</span>}
        </div>

        <div className="tile__meta">
          <div className="tile__name">{title}</div>
          {/* PRINCIPLE 7 — three facts, and the fourth one goes in the panel. */}
          <div className="tile__row" style={{ flexWrap: 'wrap', rowGap: 3 }}>
            <span>{typeWord}</span>
            <span className={`st ${dead ? 'st--bad' : 'st--ok'}`} style={{ fontSize: 12 }}>
              {dead ? labels.unavailable : labels.ready}
            </span>
            <span className="mono">{fmtDate(asset.created_at)}</span>
          </div>
        </div>
      </button>

      {/* The row actions. They rest invisible, arrive on hover, arrive on
          keyboard focus, and are ALWAYS present on a coarse pointer — see the
          .stow rule in index.css. They sit on the media, which is the one
          place this system allows a dark chip, exactly as .dur does. */}
      <div
        className="stow"
        style={{
          position: 'absolute', insetBlockStart: 7, insetInlineEnd: 7,
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'rgba(0,0,0,0.72)', borderRadius: 'var(--r-sm)',
          padding: '2px 4px',
        }}
      >
        {viewable && (
          <button
            type="button"
            onClick={() => onOpen(asset)}
            aria-label={labels.open}
            title={labels.open}
            style={{ color: '#fff', display: 'grid', placeItems: 'center', padding: 5 }}
          >
            <Expand size={14} />
          </button>
        )}
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          download
          aria-label={labels.download}
          title={labels.download}
          style={{
            color: '#fff', display: 'grid', placeItems: 'center', padding: 5,
            opacity: url ? 1 : 0.4, pointerEvents: url ? undefined : 'none',
          }}
        >
          <Download size={14} />
        </a>
        <button
          type="button"
          onClick={() => onSelect(asset, { del: true })}
          aria-label={labels.remove}
          title={labels.remove}
          style={{ color: '#fff', display: 'grid', placeItems: 'center', padding: 5 }}
        >
          <Strike size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── THE DETAILS PANEL ─────────────────────────────────────────────────────
   Principle 11: the far-end panel is WHAT IS SELECTED. Every row below reads
   a real column off the object — nothing is invented, and a field the backend
   never filled is simply not drawn. */
function Field({ label, children }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', paddingBlock: 5, borderBlockEnd: '1px solid var(--line)' }}>
      <span className="caption" style={{ flex: 'none', minInlineSize: 92 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-2)', minInlineSize: 0 }} className="break-anywhere">{children}</span>
    </div>
  )
}

function AssetsPage() {
  const navigate = useNavigate()
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const openMedia = useLightbox()

  const [assets, setAssets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  /* id → { kind, w, h, duration, broken } measured off the decoded media. */
  const [probes, setProbes] = useState({})

  /* uiStore has no key for the four filter words, for 'retry', for the load
     error or for any panel field, and t() falls through to the raw key — which
     is why the old filter rail read "all / images / videos / audio" in Arabic.
     The store is frozen, so the bilingual literal is inlined here. t() still
     wins the moment those keys are added upstream. */
  const label = useCallback((key, arText, enText) => {
    const v = t(key)
    return v === key ? (ar ? arText : enText) : v
  }, [t, ar])

  const labels = useMemo(() => ({
    kind: {
      image: ar ? 'صورة' : 'Image',
      video: ar ? 'فيديو' : 'Video',
      audio: ar ? 'صوت' : 'Audio',
    },
    ready: ar ? 'جاهز' : 'Ready',
    unavailable: ar ? 'غير متوفر' : 'Unavailable',
    open: ar ? 'فتح بالحجم الكامل' : 'Open full size',
    download: ar ? 'تنزيل' : 'Download',
    remove: t('deleteAsset'),
  }), [ar, t])

  const load = useCallback(async (nextPage) => {
    const first = nextPage === 1
    try {
      if (first) { setLoading(true); setError(null) } else { setLoadingMore(true) }
      const result = await assetService.getAssets(nextPage, PAGE_SIZE)
      const batch = Array.isArray(result?.assets) ? result.assets : []
      setAssets((prev) => (first ? batch : [...prev, ...batch]))
      setTotal(Number(result?.total) || (first ? batch.length : 0))
      setHasMore(!!result?.has_more)
      setPage(nextPage)
      if (!first) setError(null)
    } catch (err) {
      setError(label('errorLoadingAssets', 'تعذّر تحميل المكتبة.', 'Failed to load assets'))
    } finally {
      if (first) { setLoading(false) } else { setLoadingMore(false) }
    }
  }, [label])

  /* Mount only. `load` closes over the bilingual `label`, so listing it here
     would refetch the whole library every time the language is toggled. */
  useEffect(() => { load(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (assetId) => {
    try {
      await assetService.deleteAsset(assetId)
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
      setTotal((prev) => Math.max(0, prev - 1))
      setSelectedId((prev) => (prev === assetId ? null : prev))
    } catch (err) {
      setError(ar ? 'تعذّر حذف الأصل.' : 'Could not delete that asset.')
    }
  }

  const onProbe = useCallback((id, { w, h, duration }) => {
    setProbes((prev) => {
      const kind = w > 0 && h > 0 ? kindFromRatio(w / h) : prev[id]?.kind
      const next = { ...prev[id], kind, w: w || prev[id]?.w, h: h || prev[id]?.h }
      if (Number.isFinite(duration)) next.duration = duration
      const was = prev[id]
      if (was && was.kind === next.kind && was.w === next.w && was.h === next.h && was.duration === next.duration) return prev
      return { ...prev, [id]: next }
    })
  }, [])

  const onBroken = useCallback((id) => {
    setProbes((prev) => (prev[id]?.broken ? prev : { ...prev, [id]: { ...prev[id], broken: true } }))
  }, [])

  const filteredAssets = useMemo(() => (
    filter === 'all' ? assets : assets.filter((a) => String(a.asset_type || '').toLowerCase() === filter)
  ), [assets, filter])

  /* Live counts: the filter says what is behind it before you press it. They
     count what is LOADED, which is what the grid can actually show. */
  const counts = useMemo(() => {
    const c = { all: assets.length, image: 0, video: 0, audio: 0 }
    assets.forEach((a) => {
      const k = String(a.asset_type || '').toLowerCase()
      if (c[k] !== undefined) c[k] += 1
    })
    return c
  }, [assets])

  const filters = [
    { key: 'all', label: label('all', 'الكل', 'All') },
    { key: 'image', label: label('images', 'صور', 'Images') },
    { key: 'video', label: label('videos', 'فيديو', 'Videos') },
    { key: 'audio', label: label('audio', 'صوت', 'Audio') },
  ]

  const selected = useMemo(
    () => filteredAssets.find((a) => a.id === selectedId) || null,
    [filteredAssets, selectedId]
  )

  const onSelect = (asset, opts) => {
    setSelectedId(asset.id)
    if (opts?.del) setPendingDelete(asset)
  }

  const onOpen = (asset) => {
    const url = urlOf(asset)
    if (!url) return
    setSelectedId(asset.id)
    openMedia(url, String(asset.asset_type).toLowerCase() === 'video' ? 'video' : 'image')
  }

  const countLine = ar ? (
    <>
      <N v={filteredAssets.length} /> من <N v={assets.length} />
      {total > assets.length && <> · <N v={total} /> في المكتبة</>}
    </>
  ) : (
    <>
      <N v={filteredAssets.length} /> of <N v={assets.length} />
      {total > assets.length && <> · <N v={total} /> in the library</>}
    </>
  )

  return (
    <div className="main">
      <div className="pagehead">
        <div className="min-w-0">
          <h1 className="page-title">{ar ? 'المكتبة' : 'Library'}</h1>
          <p className="page-sub">
            {ar
              ? 'كل ما أنتجته مشاريعك، في مكان واحد'
              : 'Everything your projects have produced, in one place'}
          </p>
        </div>
        {/* Principle 12 — the one filled button on this screen, top-far-end. */}
        <div className="shrink-0" style={{ marginInlineStart: 'auto' }}>
          <button type="button" className="btn" onClick={() => navigate('/')}>
            {ar ? 'مشروع جديد' : 'New project'}
          </button>
        </div>
      </div>

      {/* ── THE CONTROLS, ON THE PAGE, BESIDE WHAT THEY CONTROL ───────────── */}
      <div className="sechead" style={{ marginBlockStart: 0 }}>
        <h2 className="sec-title">{ar ? 'الوسائط' : 'Media'}</h2>
        <span className="caption">{countLine}</span>
        <button type="button" className="btn-t" onClick={() => load(1)} disabled={loading}>
          <Revise size={14} />
          {ar ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="scroll-x" style={{ marginBlockEnd: 16 }}>
        <div className="seg" role="group" aria-label={t('filters')}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className="seg__cell"
              data-on={filter === f.key ? 'true' : 'false'}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {/* Spacing comes from .seg__cell's flex gap — an inline margin
                  on a .mono isolate gets collapsed inside an RTL run. */}
              <span className="mono" style={{ opacity: 0.65 }}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card card-pad" style={{ borderColor: 'var(--bad)', marginBlockEnd: 20 }}>
          <div className="st st--bad" style={{ marginBlockEnd: 6 }}>{t('error')}</div>
          <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>{error}</p>
          <button type="button" className="btn-q btn-q--sm" style={{ marginBlockStart: 12 }} onClick={() => load(1)}>
            <Revise size={14} />
            {label('retry', 'إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}

      <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
        <div style={{ minInlineSize: 0 }}>
          {loading ? (
            /* Only the data region is skeletoned, and .skel does not pulse.
               Heights vary because the grid is aspect-driven, so a wall of
               identical boxes would be a lie about what is arriving. */
            <div className="grid-media" aria-busy="true">
              {['16/9', '9/16', '16/9', '1/1', '16/9', '9/16', '16/9', '16/9'].map((r, i) => (
                <div key={i} className="card" style={{ overflow: 'hidden' }}>
                  <div className="skel" style={{ aspectRatio: r, borderRadius: 0 }} />
                  <div style={{ padding: 13 }}>
                    <div className="skel" style={{ blockSize: 12, inlineSize: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="card card-pad">
              <EmptyState
                legend={t('noAssets')}
                line={filter === 'all'
                  ? (ar
                    ? 'المكتبة فارغة. كل ما تنتجه المهام المؤكَّدة يصل إلى هنا.'
                    : 'The library is empty. Everything a confirmed job produces lands here.')
                  : (ar
                    ? <>لا توجد أصول من هذا النوع ضمن <N v={assets.length} /> أصلًا.</>
                    : <>Nothing of this type among <N v={assets.length} /> assets.</>)}
              >
                {filter === 'all' ? (
                  <button type="button" className="btn-q btn-q--sm" onClick={() => navigate('/')}>
                    {ar ? 'ابدأ مشروعاً' : 'Start a project'}
                  </button>
                ) : (
                  <button type="button" className="btn-q btn-q--sm" onClick={() => setFilter('all')}>
                    {ar ? 'عرض الكل' : 'Show all'}
                  </button>
                )}
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="grid-media">
                {filteredAssets.map((asset) => (
                  <AssetTile
                    key={asset.id}
                    asset={asset}
                    ar={ar}
                    labels={labels}
                    selected={asset.id === selectedId}
                    probe={probes[asset.id]}
                    onSelect={onSelect}
                    onOpen={onOpen}
                    onProbe={onProbe}
                    onBroken={onBroken}
                  />
                ))}
              </div>

              {/* Drawn only when the server says there is another page. */}
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBlockStart: 22 }}>
                  <button
                    type="button"
                    className="btn-q"
                    onClick={() => load(page + 1)}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? t('loading')
                      : (ar ? 'تحميل المزيد' : 'Load more')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selected && (
          <aside
            className="card card-pad order-first lg:order-none lg:sticky"
            style={{ alignSelf: 'start', insetBlockStart: 'calc(var(--topbar) + 18px)' }}
            aria-label={ar ? 'تفاصيل الأصل' : 'Asset details'}
          >
            {(() => {
              const url = urlOf(selected)
              const type = String(selected.asset_type || '').toLowerCase()
              const meta = metaOf(selected)
              const probe = probes[selected.id]
              const dead = !url || probe?.broken
              const w = probe?.w || Number(meta.width) || 0
              const h = probe?.h || Number(meta.height) || 0
              const clock = fmtClock(probe?.duration ?? Number(meta.duration))
              const name = selected.filename || fileNameOf(url)
              const title =
                selected.filename || selected.prompt || meta.prompt || meta.title ||
                fileNameOf(url) || (ar ? 'بدون عنوان' : 'Untitled')

              return (
                <>
                  <div className="flex items-start gap-3" style={{ marginBlockEnd: 12 }}>
                    <div style={{ minInlineSize: 0 }}>
                      <span className="label">{ar ? 'المحدَّد' : 'Selected'}</span>
                      <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35 }} className="break-anywhere">
                        {title}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-i shrink-0"
                      style={{ marginInlineStart: 'auto' }}
                      onClick={() => setSelectedId(null)}
                      aria-label={ar ? 'إغلاق التفاصيل' : 'Close details'}
                      title={ar ? 'إغلاق التفاصيل' : 'Close details'}
                    >
                      <Close size={14} />
                    </button>
                  </div>

                  <Field label={ar ? 'النوع' : 'Kind'}>{labels.kind[type] || (ar ? 'ملف' : 'File')}</Field>
                  <Field label={ar ? 'الحالة' : 'Status'}>
                    <span className={`st ${dead ? 'st--bad' : 'st--ok'}`}>
                      {dead ? labels.unavailable : labels.ready}
                    </span>
                  </Field>
                  <Field label={ar ? 'المقاس' : 'Dimensions'}>
                    {w > 0 && h > 0 ? <span className="mono">{`${w}×${h}`}</span> : ''}
                  </Field>
                  <Field label={ar ? 'المدة' : 'Duration'}>
                    {clock ? <span className="mono">{clock}</span> : ''}
                  </Field>
                  <Field label={ar ? 'المزوّد' : 'Provider'}>
                    {selected.provider ? <span className="mono">{selected.provider}</span> : ''}
                  </Field>
                  <Field label={ar ? 'النموذج' : 'Model'}>
                    {selected.model_name ? <span className="mono">{selected.model_name}</span> : ''}
                  </Field>
                  <Field label={ar ? 'اسم الملف' : 'File name'}>
                    {name ? <span className="mono">{name}</span> : ''}
                  </Field>
                  <Field label={ar ? 'أُنشئ' : 'Created'}>
                    {fmtDate(selected.created_at) ? <span className="mono">{fmtDate(selected.created_at)}</span> : ''}
                  </Field>
                  <Field label={ar ? 'مرجع' : 'Reference'}>
                    {selected.is_preview
                      ? (selected.preview_type
                        ? <span className="mono">{selected.preview_type}</span>
                        : (ar ? 'صورة مرجعية' : 'Reference image'))
                      : ''}
                  </Field>

                  {/* Audio has no lightbox and never had one. Rather than draw
                      a dead open control, the panel plays it where it is. */}
                  {type === 'audio' && url && (
                    <audio
                      controls
                      src={url}
                      style={{ inlineSize: '100%', marginBlockStart: 14 }}
                    />
                  )}

                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBlockStart: 16 }}>
                    {(type === 'image' || type === 'video') && url && (
                      <button type="button" className="btn-q btn-q--sm" onClick={() => onOpen(selected)}>
                        <Expand size={14} />
                        {labels.open}
                      </button>
                    )}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="btn-q btn-q--sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <Download size={14} />
                        {labels.download}
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-t btn-t--danger"
                      style={{ marginInlineStart: 'auto' }}
                      onClick={() => setPendingDelete(selected)}
                    >
                      <Strike size={14} />
                      {labels.remove}
                    </button>
                  </div>
                </>
              )
            })()}
          </aside>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title={t('deleteAsset')}
        message={ar
          ? 'سيُحذف هذا الأصل نهائيًا. لا يمكن التراجع.'
          : 'This asset will be permanently removed. This cannot be undone.'}
        confirmLabel={t('deleteAsset')}
        cancelLabel={ar ? 'إلغاء' : 'Cancel'}
        danger
        onConfirm={() => { const a = pendingDelete; setPendingDelete(null); if (a) handleDelete(a.id) }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default AssetsPage
