import React from 'react'
import { FileText, Music, Video, Image as ImageIcon } from 'lucide-react'

// Backend asset fields: { id, chat_id, run_id, asset_type, provider, model_name, storage_url, public_url, created_at, metadata }

function AssetCard({ asset, isSelected, onSelect }) {
  const type = asset.asset_type || 'file'

  const getIcon = () => {
    switch (type) {
      case 'image': return <ImageIcon size={20} />
      case 'video': return <Video size={20} />
      case 'audio': return <Music size={20} />
      default: return <FileText size={20} />
    }
  }

  const label = asset.model_name || asset.provider || type

  return (
    <div
      onClick={() => onSelect(asset)}
      className={`cursor-pointer rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-[#6c63ff] scale-105' : 'hover:scale-105'
      }`}
    >
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] aspect-square flex items-center justify-center relative group">
        {type === 'image' && asset.public_url ? (
          <img
            src={asset.public_url}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#6c63ff] transition-colors">
            {getIcon()}
            <p className="text-xs mt-2 text-center px-2 truncate uppercase">{type}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2">
          <p className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AssetCard
