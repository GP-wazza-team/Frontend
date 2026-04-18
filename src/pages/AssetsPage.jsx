import React, { useState, useEffect } from 'react'
import AssetGrid from '../components/assets/AssetGrid'
import AssetModal from '../components/assets/AssetModal'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('gallery')}</h1>
        <p className="text-gray-400">Browse and manage generated assets</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-base min-w-48"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Chat</label>
          <select
            value={chatFilter}
            onChange={(e) => setChatFilter(e.target.value)}
            className="input-base min-w-48"
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
