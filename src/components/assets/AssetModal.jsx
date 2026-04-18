import React from 'react'
import { X, Download, Trash2 } from 'lucide-react'
import { assetService } from '../../services/assetService'
import { useUIStore } from '../../store/uiStore'

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

// Backend asset fields: { id, chat_id, run_id, asset_type, provider, model_name, storage_url, public_url, created_at, metadata }

function AssetModal({ asset, onClose, onDelete }) {
  const { t } = useUIStore()
  const type = asset?.asset_type || 'file'
  const url = asset?.public_url || asset?.storage_url

  if (!asset) return null

  const handleDelete = async () => {
    if (!window.confirm(t('deleteAsset'))) return
    try {
      await assetService.deleteAsset(asset.id)
      onDelete(asset.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  const renderPreview = () => {
    if (!url) {
      return (
        <div className="bg-[#0f0f0f] border border-[#2a2a3e] rounded-lg p-8 flex items-center justify-center min-h-40">
          <p className="text-gray-400">No preview available</p>
        </div>
      )
    }
    switch (type) {
      case 'image':
        return <img src={url} alt={asset.model_name} className="max-h-80 rounded-lg w-full object-contain" />
      case 'video':
        return <video controls className="max-h-80 rounded-lg w-full" src={url} />
      case 'audio':
        return <audio controls className="w-full" src={url} />
      default:
        return (
          <div className="bg-[#0f0f0f] border border-[#2a2a3e] rounded-lg p-8 flex items-center justify-center min-h-40">
            <p className="text-gray-400 uppercase font-mono">{type}</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-xl max-w-2xl w-full border border-[#2a2a3e] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3e]">
          <h2 className="text-lg font-semibold capitalize">{type} Asset</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2a2a3e] rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center">{renderPreview()}</div>

          <div className="space-y-2 bg-[#0f0f0f] rounded-lg p-4 text-sm">
            {asset.provider && (
              <div className="flex justify-between">
                <span className="text-gray-400">{t('provider')}</span>
                <span className="text-white">{asset.provider}</span>
              </div>
            )}
            {asset.model_name && (
              <div className="flex justify-between">
                <span className="text-gray-400">Model</span>
                <span className="text-white">{asset.model_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">{t('date')}</span>
              <span className="text-white">{formatTime(asset.created_at)}</span>
            </div>
            {asset.chat_id && (
              <div className="flex justify-between">
                <span className="text-gray-400">Chat ID</span>
                <span className="text-white font-mono text-xs">{asset.chat_id}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {url && (
              <a
                href={url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </a>
            )}
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetModal
