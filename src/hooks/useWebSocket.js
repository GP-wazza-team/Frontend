import { useEffect, useRef, useState } from 'react'

export const useWebSocket = (url, handlers = {}) => {
  const ws = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)

  useEffect(() => {
    if (!url) return

    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setIsConnected(true)
      handlers.onOpen?.()
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        handlers.onMessage?.(data)
      } catch (error) {
        setLastMessage(event.data)
        handlers.onMessage?.(event.data)
      }
    }

    ws.current.onerror = (error) => {
      handlers.onError?.(error)
    }

    ws.current.onclose = () => {
      setIsConnected(false)
      handlers.onClose?.()
    }

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close()
      }
    }
  }, [url])

  const send = (data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }

  return {
    send,
    isConnected,
    lastMessage,
  }
}
