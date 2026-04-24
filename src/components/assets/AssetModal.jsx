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
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 flex items-center justify-center min-h-40">
          <p className="text-gray-300 font-medium">No preview available</p>
        </div>
      )
    }
    switch (type) {
      case 'image':
        return <img src={url} alt={asset.model_name} className="max-h-80 rounded-2xl w-full object-contain" />
      case 'video':
        return <video controls className="max-h-80 rounded-2xl w-full" src={url} />
      case 'audio':
        return <audio controls className="w-full" src={url} />
      default:
        return (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 flex items-center justify-center min-h-40">
            <p className="text-gray-300 uppercase font-mono font-bold">{type}</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="card-light max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-900 capitalize">{type} Asset</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center">{renderPreview()}</div>

          <div className="space-y-3 bg-gray-50 rounded-xl p-5 text-sm border border-gray-100">
            {asset.provider && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">{t('provider')}</span>
                <span className="text-slate-900 font-semibold">{asset.provider}</span>
              </div>
            )}
            {asset.model_name && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Model</span>
                <span className="text-slate-900 font-semibold">{asset.model_name}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">{t('date')}</span>
              <span className="text-slate-900">{formatTime(asset.created_at)}</span>
            </div>
            {asset.chat_id && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Chat ID</span>
                <span className="text-slate-900 font-mono text-xs">{asset.chat_id}</span>
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
                className="flex-1 btn-secondary-light flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </a>
            )}
            <button
              onClick={handleDelete}
              className="flex-1 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition-colors flex items-center justify-center gap-2 border border-rose-100"
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
