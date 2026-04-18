import React, { useEffect, useState } from 'react'
import AssetCard from './AssetCard'
import { assetService } from '../../services/assetService'
import { useUIStore } from '../../store/uiStore'

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
        <span className="text-gray-400">{t('loading')}</span>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-400">{t('noAssets')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            className="btn-secondary disabled:opacity-50"
          >
            {loading ? t('loading') : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AssetGrid
