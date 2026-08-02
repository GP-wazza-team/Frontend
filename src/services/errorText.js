/* WHAT ACTUALLY WENT WRONG.
 *
 * Every call site used to write `error?.response?.data?.detail || error?.message
 * || 'Something failed'` inline, which fails the user in three ways:
 *
 *   - FastAPI returns `detail` as a LIST of {loc, msg, type} for any 422. That
 *     list stringifies to "[object Object]", so a validation failure — the most
 *     common and most fixable error there is — arrived as noise.
 *   - A dead network, a CORS rejection and a 300s timeout all collapse to
 *     axios's bare "Network Error", which does not say which of the three it is.
 *   - A 500 with an empty body fell through to the fallback, so the status code
 *     the user could have quoted to us was thrown away.
 *
 * This module is the single answer to "what do I show the user". It always
 * returns a non-empty string, and it never returns "[object Object]".
 */

// FastAPI validation errors: [{loc: ['body', 'prompt'], msg: 'field required'}]
// The `loc` head is always 'body'/'query'/'path' — noise to a reader, so the
// field name is the tail.
function fromValidationList(list) {
  const parts = list
    .map((item) => {
      if (typeof item === 'string') return item
      const msg = item?.msg || item?.message
      if (!msg) return null
      const loc = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null
      return loc && loc !== 'body' ? `${loc}: ${msg}` : msg
    })
    .filter(Boolean)
  return parts.length ? parts.join('; ') : null
}

function fromDetail(detail) {
  if (!detail) return null
  if (typeof detail === 'string') return detail.trim() || null
  if (Array.isArray(detail)) return fromValidationList(detail)
  if (typeof detail === 'object') {
    // Some handlers nest the real text one level down.
    return detail.msg || detail.message || detail.error || JSON.stringify(detail)
  }
  return String(detail)
}

/**
 * Turn any thrown thing into one line a user can read and quote back to us.
 *
 * @param {unknown} error   axios error, Error, string, or anything else
 * @param {string}  fallback used only when nothing else yields text
 */
export function describeError(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  if (typeof error === 'string') return error.trim() || fallback

  const response = error.response

  if (response) {
    const body = response.data
    const detail = fromDetail(body?.detail) || fromDetail(body?.error) || fromDetail(body?.message)
    if (detail) return detail
    // A body-less error still carries a status worth quoting.
    if (response.status) {
      return `${response.status}${response.statusText ? ` ${response.statusText}` : ''} from the server`
    }
  }

  // No response at all: the request never completed. Separate the cases,
  // because the fix is different for each.
  if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
    return 'The request timed out before the server answered'
  }
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Could not reach the server — it may be down, or the connection dropped'
  }

  return error.message?.trim() || fallback
}

/**
 * The same text, prefixed with the operation that failed, for places that show
 * one line with no other context (toasts, the transcript's error row).
 */
export function describeFailure(operation, error, fallback) {
  const detail = describeError(error, fallback)
  return `${operation}: ${detail}`
}

export default describeError
