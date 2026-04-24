import React from 'react'
import { FileText, Music, Video, Image as ImageIcon } from 'lucide-react'

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
      className={`cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 group ${
        isSelected ? 'ring-2 ring-violet-500 scale-[1.02]' : 'hover:scale-[1.02]'
      }`}
    >
      <div className="bg-white/[0.03] border border-white/[0.06] aspect-square flex items-center justify-center relative overflow-hidden">
        {type === 'image' && asset.public_url ? (
          <img
            src={asset.public_url}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/20 group-hover:text-violet-400 transition-colors duration-300">
            {getIcon()}
            <p className="text-xs mt-2 text-center px-2 truncate uppercase font-medium">{type}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <p className="text-xs text-white font-medium truncate w-full">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AssetCard
