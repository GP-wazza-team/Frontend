import React, { useEffect, useState } from 'react'
import AssetCard from './AssetCard'
import { assetService } from '../../services/assetService'
import { useUIStore } from '../../store/uiStore'
import { Loader2 } from 'lucide-react'

function AssetGrid({ selectedAsset, onSelectAsset, typeFilter = '', chatFilter = '' }) {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const { t } = useUIStore()

  useEffect(() => {
    loadAssets()
  }, [typeFilter, chatFilter, page])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (typeFilter) filters.type = typeFilter
      if (chatFilter) filters.chat_id = chatFilter

      const data = await assetService.getAssets(page, 20, filters)
      const newAssets = data.assets || []
      setAssets(page === 1 ? newAssets : [...assets, ...newAssets])
      setHasMore(data.has_more || false)
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && assets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-violet-500 animate-spin" />
          <span className="text-white/30 text-sm">{t('loading')}</span>
        </div>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-white/20 text-sm">{t('noAssets')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            isSelected={selectedAsset?.id === asset.id}
            onSelect={onSelectAsset}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage(page + 1)}
            disabled={loading}
            className="btn-outline disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('loading')}
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default AssetGrid
