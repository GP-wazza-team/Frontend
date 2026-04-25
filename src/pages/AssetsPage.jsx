import React, { useEffect, useState } from 'react'
import { assetService } from '../services/assetService'
import { useUIStore } from '../store/uiStore'
import { Image, Video, Music, Trash2, Loader2, Download } from 'lucide-react'

function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const { t } = useUIStore()

  useEffect(() => { loadAssets() }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await assetService.getAssets(1, 100)
      setAssets(result.assets || [])
    } catch (err) {
      setError(t('errorLoadingAssets') || 'Failed to load assets')
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

  const getAssetIcon = (type) => {
    switch (type) {
      case 'video': return <Video size={14} />
      case 'audio': return <Music size={14} />
      default: return <Image size={14} />
    }
  }

  const getAssetUrl = (asset) => asset.url || asset.public_url || asset.storage_url || ''

  const filteredAssets = filter === 'all'
    ? assets
    : assets.filter((a) => (a.asset_type || '').toLowerCase() === filter)

  const filters = [
    { key: 'all', label: t('all') || 'All' },
    { key: 'image', label: t('images') || 'Images' },
    { key: 'video', label: t('videos') || 'Videos' },
    { key: 'audio', label: t('audio') || 'Audio' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('assetLibrary') || 'Asset Library'}</h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('totalAssets') || 'Total Assets'}: {assets.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            style={{
              backgroundColor: filter === f.key ? 'var(--accent)' : 'var(--bg-surface)',
              color: filter === f.key ? 'white' : 'var(--text-secondary)',
              border: filter === f.key ? '1px solid var(--accent)' : '1px solid var(--border)'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>{error}</p>
          <button onClick={loadAssets} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)' }}>{t('retry') || 'Retry'}</button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16">
          <Image size={40} className="mx-auto mb-3" style={{ color: 'var(--border-hover)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('noAssets') || 'No assets'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAssets.map((asset) => {
            const url = getAssetUrl(asset)
            const type = (asset.asset_type || '').toLowerCase()
            return (
              <div key={asset.id} className="group surface overflow-hidden transition-all duration-200 hover:border-[var(--border-hover)]" style={{ border: '1px solid var(--border)' }}>
                <div className="aspect-square overflow-hidden relative">
                  {type === 'image' ? (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  ) : type === 'video' ? (
                    <video src={url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-hover)' }}>
                      <Music size={32} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <a href={url} target="_blank" rel="noreferrer" download className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <Download size={14} className="text-gray-800" />
                    </a>
                    <button onClick={() => handleDelete(asset.id)} className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors">
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    {getAssetIcon(type)}
                    <span className="text-[11px] uppercase font-semibold">{type}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AssetsPage
