/* Reads the OS reduced-motion preference and re-renders when it changes.
   Six lines of matchMedia, which is the whole reason `motion` was in the
   dependency list — the three transitions it was earmarked for (drawer,
   dialog, rail marker) are all authored in CSS, so nothing else needed it. */

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function read() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(QUERY).matches
}

export function useReducedMotion() {
  const [reduce, setReduce] = useState(read)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mq = window.matchMedia(QUERY)
    const onChange = () => setReduce(mq.matches)
    onChange()
    // Safari < 14 only has the deprecated listener API.
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  return reduce
}

export default useReducedMotion
