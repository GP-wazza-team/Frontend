import React, { useState } from 'react'
import { Check, RefreshCw, Image } from 'lucide-react'

function SceneImageReview({ scene, totalScenes, onApprove, onRegenerate, loading }) {
  const [showRegenerate, setShowRegenerate] = useState(false)
  const [tweakedPrompt, setTweakedPrompt] = useState(scene.scene_prompt)

  const imageUrl = scene.image_urls?.[0]

  const handleRegenerateSubmit = () => {
    onRegenerate(tweakedPrompt)
    setShowRegenerate(false)
  }

  return (
    <div className="max-w-3xl mx-auto animate-slideUp">
      <div className="surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Image size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {totalScenes > 1 ? `Scene ${scene.scene_number} of ${totalScenes}` : 'Reference image'} — review before generating video
          </h3>
        </div>

        {imageUrl && (
          <div className="overflow-hidden rounded-lg mb-3">
            <img src={imageUrl} alt={`Scene ${scene.scene_number}`} className="w-full max-h-96 object-cover rounded-lg" />
          </div>
        )}

        {!showRegenerate ? (
          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
              onClick={onApprove}
              disabled={loading}
            >
              <Check size={15} />
              {loading ? 'Working...' : 'Approve & generate video'}
            </button>
            <button
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
              onClick={() => setShowRegenerate(true)}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Regenerate
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              className="input-claude text-sm resize-none"
              rows={3}
              value={tweakedPrompt}
              onChange={(e) => setTweakedPrompt(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                onClick={handleRegenerateSubmit}
                disabled={loading}
              >
                <RefreshCw size={15} />
                {loading ? 'Regenerating...' : 'Regenerate image'}
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => setShowRegenerate(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SceneImageReview
