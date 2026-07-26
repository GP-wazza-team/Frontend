import React, { useState } from 'react'
import { Film, Check } from 'lucide-react'

function ScenePlanner({ scenes, reasoning, onApprove, loading }) {
  const [texts, setTexts] = useState(() =>
    Object.fromEntries(scenes.map((s) => [s.scene_number, s.scene_prompt]))
  )

  const handleChange = (sceneNumber, value) => {
    setTexts((prev) => ({ ...prev, [sceneNumber]: value }))
  }

  const handleApprove = () => {
    onApprove(scenes.map((s) => ({ scene_number: s.scene_number, scene_prompt: texts[s.scene_number] })))
  }

  return (
    <div className="max-w-3xl mx-auto animate-slideUp">
      <div className="surface p-4">
        <div className="flex items-center gap-2 mb-1">
          <Film size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {scenes.length > 1 ? `${scenes.length}-scene script` : 'Scene'} — review before generating
          </h3>
        </div>
        {reasoning && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{reasoning}</p>
        )}

        <div className="space-y-3 mt-3">
          {scenes.map((s) => (
            <div key={s.scene_number}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Scene {s.scene_number}
              </div>
              <textarea
                className="input-claude text-sm resize-none"
                rows={2}
                value={texts[s.scene_number] ?? ''}
                onChange={(e) => handleChange(s.scene_number, e.target.value)}
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <button
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
          onClick={handleApprove}
          disabled={loading}
        >
          <Check size={15} />
          {loading ? 'Approving...' : 'Approve script & start scene 1'}
        </button>
      </div>
    </div>
  )
}

export default ScenePlanner
