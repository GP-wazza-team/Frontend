import React, { useState } from 'react'
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

  const handleDeleteAsset = () => {
    setSelectedAsset(null)
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-slideUp">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
          <Image className="text-sky-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('gallery')}</h1>
          <p className="text-gray-400 text-sm">Browse and manage generated assets</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="card-light p-4 flex items-center gap-3 flex-1">
          <Filter size={16} className="text-gray-300" />
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-transparent text-slate-700 text-sm outline-none cursor-pointer font-medium"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
          </div>
        </div>

        <div className="card-light p-4 flex items-center gap-3 flex-1">
          <Filter size={16} className="text-gray-300" />
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Chat</label>
            <select
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
              className="w-full bg-transparent text-slate-700 text-sm outline-none cursor-pointer font-medium"
            >
              <option value="">All Chats</option>
              {chats.map((chat) => (
                <option key={chat.id} value={chat.id}>
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
