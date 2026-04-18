import { format, formatDistance } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export const formatDate = (date, locale = 'en') => {
  const dateLocale = locale === 'ar' ? ar : enUS
  return format(new Date(date), 'PPP p', { locale: dateLocale })
}

export const formatRelativeTime = (date, locale = 'en') => {
  const dateLocale = locale === 'ar' ? ar : enUS
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: dateLocale,
  })
}

export const truncateText = (text, length = 100) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

export const formatCost = (cost) => {
  return `$${cost.toFixed(4)}`
}

export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

export const getAssetType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'flac', 'm4a'].includes(ext)) return 'audio'
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document'
  return 'file'
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
