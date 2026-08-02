/* THE LIBRARY — /assets

   THE BIGGEST FUNCTIONAL FIX ON ANY SCREEN.

   The grid was `aspect-square object-cover`. In a tool that offers 9:16, 21:9
   and 4:3 on the plan card, cropping every output to a square destroys the
   thing the user paid to generate. It is replaced by CSS-columns masonry, so
   every asset keeps its TRUE ratio inside a Frame with a Commit Mono caption
   rail reading real data off the object. Multicol flows in the writing
   direction, so the library reads right-to-left in Arabic for free.

   ALSO
     · The black rgba(0,0,0,.5) scrim with a white circle and a rose circle
       over the artwork is gone — a flat sheet over the thing you are trying
       to look at, plus icon-in-a-circle twice. The actions dock into the
       Frame's caption rail on hover AND on :focus-within, as bare marks, so
       a keyboard user can reach them. They could not before.
     · The filled-pill filter row moved to the rail panel as text rows with
       LIVE COUNTS, so the filter tells you what is behind it before you
       press it.
     · Delete now goes through the app's ConfirmDialog. It used to fire
       immediately, with no confirmation, on a single click of a control
       revealed by hover. The assetService call is unchanged.
     · openMedia was never pulled off the lightbox context — the click
       handlers on every tile threw a ReferenceError. The lightbox now works.
     · Empty and error states are a legend, a sentence and a real action, not
       a 40px grey glyph and a spinner. */

import React, { useEffect, useMemo, useState } from 'react'
import { assetService } from '../services/assetService'
import { useUIStore } from '../store/uiStore'
import { ImageMark, VideoMark, AudioMark, Strike, Download, Revise } from '../components/Icon'
import { useLightbox } from '../components/MediaLightbox'
import { RailPanelPortal } from '../components/Sidebar'
import ConfirmDialog from '../components/ConfirmDialog'
import Meter from '../components/ui/Meter'
import { Band, PanelGroup } from '../components/dashboard/Instruments'
import Frame, { mediaStyle } from '../components/ui/Frame'
import EmptyState from '../components/ui/EmptyState'

const TYPE_MARK = { video: VideoMark, audio: AudioMark, image: ImageMark }

function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const openMedia = useLightbox()

  /* uiStore has no key for these four filters, for 'retry' or for the load
     error, and t() falls through to the raw key — which is why the filter rail
     read "all / images / videos / audio" in Arabic. The store is frozen, so
     the bilingual literal is inlined here exactly as the rail inlines 'Admin'.
     t() still wins the moment those keys are added upstream. */
  const label = (key, arText, enText) => {
    const v = t(key)
    return v === key ? (ar ? arText : enText) : v
  }

  useEffect(() => { loadAssets() }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await assetService.getAssets(1, 100)
      setAssets(result.assets || [])
    } catch (err) {
      setError(label('errorLoadingAssets', 'تعذّر تحميل المكتبة.', 'Failed to load assets'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (assetId) => {
    try {
      await assetService.deleteAsset(assetId)
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const getAssetUrl = (asset) => asset.url || asset.public_url || asset.storage_url || ''

  const filteredAssets = filter === 'all'
    ? assets
    : assets.filter((a) => (a.asset_type || '').toLowerCase() === filter)

  /* Live counts: the filter says what is behind it before you press it. */
  const counts = useMemo(() => {
    const c = { all: assets.length, image: 0, video: 0, audio: 0 }
    assets.forEach((a) => {
      const k = (a.asset_type || '').toLowerCase()
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

  const rail = (
    <PanelGroup legend={t('filters')} first>
      <div className="flex flex-col">
        {filters.map((f) => {
          const on = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={on}
              className="text-action flex items-center justify-between w-full"
              style={{ fontSize: 12, color: on ? 'var(--ink)' : 'var(--ink-3)', fontWeight: on ? 600 : 500 }}
            >
              <span>{f.label}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{counts[f.key] ?? 0}</span>
            </button>
          )
        })}
      </div>
    </PanelGroup>
  )

  const body = () => {
    if (loading) {
      return (
        <>
          <div className="flex items-center gap-3" style={{ marginBlockEnd: 16 }}>
            <Meter cells={5} mode="indeterminate" tone="ink" label={t('loading')} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('loading')}</span>
          </div>
          {/* Skeletons at varied true-to-life heights: the library is masonry,
              so a uniform grid of squares would reflow on arrival. */}
          <div className="columns-2 md:columns-3 lg:columns-4" style={{ columnGap: 16 }} aria-busy="true">
            {[220, 300, 180, 260, 200, 330, 240, 190].map((h, i) => (
              <div key={i} style={{ breakInside: 'avoid', marginBlockEnd: 16 }}>
                <div className="skel" style={{ blockSize: h }} />
              </div>
            ))}
          </div>
        </>
      )
    }

    if (error) {
      return (
        <EmptyState legend={t('error')} line={error} tone="var(--state-fail)">
          <button type="button" className="text-action" onClick={loadAssets}>
            <Revise size={16} />
            {label('retry', 'إعادة المحاولة', 'Retry')}
          </button>
        </EmptyState>
      )
    }

    if (filteredAssets.length === 0) {
      return (
        <EmptyState
          legend={t('noAssets')}
          line={filter === 'all'
            ? (ar
              ? 'المكتبة فارغة. كل ما تنتجه المهام المؤكَّدة يصل إلى هنا.'
              : 'The library is empty. Everything a confirmed job produces lands here.')
            : (ar
              ? `لا توجد أصول من هذا النوع ضمن ${assets.length} أصلًا.`
              : `Nothing of this type among ${assets.length} assets.`)}
        >
          {filter !== 'all' && (
            <button type="button" className="text-action" onClick={() => setFilter('all')}>
              {ar ? 'عرض الكل' : 'Show all'}
            </button>
          )}
        </EmptyState>
      )
    }

    return (
      <div className="columns-2 md:columns-3 lg:columns-4" style={{ columnGap: 16 }}>
        {filteredAssets.map((asset) => {
          const url = getAssetUrl(asset)
          const type = (asset.asset_type || '').toLowerCase()
          const Mark = TYPE_MARK[type] || ImageMark
          return (
            <div key={asset.id} className="group" style={{ breakInside: 'avoid', marginBlockEnd: 16 }}>
              <Frame
                interactive={type === 'image' || type === 'video'}
                onOpen={() => url && openMedia(url, type === 'video' ? 'video' : 'image')}
                caption={(
                  <span className="flex items-center gap-2">
                    <Mark size={12} />
                    <span>{type || 'asset'}</span>
                  </span>
                )}
                actions={(
                  <span className="flex items-center gap-1 flex-none stow">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-action"
                      style={{ padding: 3 }}
                      aria-label={`Download ${type || 'asset'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      className="text-action text-action--danger"
                      style={{ padding: 3 }}
                      aria-label={`${t('deleteAsset')}`}
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(asset) }}
                    >
                      <Strike size={14} />
                    </button>
                  </span>
                )}
              >
                {type === 'image' ? (
                  <img src={url} alt="" style={mediaStyle} loading="lazy" />
                ) : type === 'video' ? (
                  <video src={url} style={mediaStyle} preload="metadata" />
                ) : (
                  <span
                    className="mono flex items-center gap-2"
                    style={{ blockSize: 88, fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}
                  >
                    <AudioMark size={16} />
                    {type || 'file'}
                  </span>
                )}
              </Frame>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="wz-page" style={{ rowGap: 32, alignContent: 'start' }}>
      <RailPanelPortal>{rail}</RailPanelPortal>

      <Band
        index={1}
        legend={t('assets')}
        note={ar
          ? `${filteredAssets.length} من ${assets.length}`
          : `${filteredAssets.length} of ${assets.length}`}
        span
      >
        {body()}
      </Band>

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
