import React, { useState, useEffect } from 'react'
import AssetGrid from '../components/assets/AssetGrid'
import AssetModal from '../components/assets/AssetModal'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'
import { Image, Filter } from 'lucide-react'

function AssetsPage() {
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [chatFilter, setChatFilter] = useState('')
  const { chats } = useChatStore()
  const { t } = useUIStore()

  const handleDeleteAsset = (assetId) => {
    setSelectedAsset(null)
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-slideUp">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
          <Image className="text-cyan-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('gallery')}</h1>
          <p className="text-white/30 text-sm">Browse and manage generated assets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="glass p-4 flex items-center gap-3 flex-1">
          <Filter size={16} className="text-white/20" />
          <div className="flex-1">
            <label className="block text-xs text-white/30 mb-1.5 font-medium uppercase tracking-wider">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Types</option>
              <option value="image" className="bg-slate-900">Images</option>
              <option value="video" className="bg-slate-900">Videos</option>
              <option value="audio" className="bg-slate-900">Audio</option>
              <option value="document" className="bg-slate-900">Documents</option>
            </select>
          </div>
        </div>

        <div className="glass p-4 flex items-center gap-3 flex-1">
          <Filter size={16} className="text-white/20" />
          <div className="flex-1">
            <label className="block text-xs text-white/30 mb-1.5 font-medium uppercase tracking-wider">Chat</label>
            <select
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Chats</option>
              {chats.map((chat) => (
                <option key={chat.id} value={chat.id} className="bg-slate-900">
                  {chat.title || `Chat #${chat.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <AssetGrid
        selectedAsset={selectedAsset}
        onSelectAsset={setSelectedAsset}
        typeFilter={typeFilter}
        chatFilter={chatFilter}
      />

      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDeleteAsset}
        />
      )}
    </div>
  )
}

export default AssetsPage
