/* ═══════════════════════════════════════════════════════════════════════════
   useMediaDownload — saving a generated image or video to the device.

   The save has to be a fetch, not a link. The media sits on S3, and a browser
   ignores the `download` attribute on a cross-origin link — which is why the
   asset library's download control opened the clip in a new tab instead of
   saving it — and the endpoint that returns it as an attachment is behind a
   bearer token that an <a href> cannot carry.

   So every save is a request, which means it can fail and it can be slow on a
   long video. Both belong to the button, not to the caller: `saving` disables
   it in the meantime and a failure is a toast rather than nothing at all.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useState } from 'react'
import { assetService } from '../services/assetService'
import { useToastStore } from '../store/toastStore'
import { useUIStore } from '../store/uiStore'

export function useMediaDownload() {
  const [saving, setSaving] = useState(false)
  const addToast = useToastStore((s) => s.addToast)
  const ar = useUIStore((s) => s.language) === 'ar'

  /* Pass `id` when the asset row is in hand (the library). The transcript
     replays media from a message's attachment list, which carries URLs and no
     ids, so there it passes `url` and the backend resolves it. */
  const download = useCallback(
    async ({ id, url, fallbackName } = {}) => {
      if (saving || (!id && !url)) return
      setSaving(true)
      try {
        await assetService.downloadMedia({ id, url, fallbackName })
      } catch (_) {
        addToast(ar ? 'تعذّر تنزيل الملف' : 'Could not download the file', 'error')
      } finally {
        setSaving(false)
      }
    },
    [saving, addToast, ar],
  )

  return { download, saving, label: ar ? 'تنزيل' : 'Download' }
}
