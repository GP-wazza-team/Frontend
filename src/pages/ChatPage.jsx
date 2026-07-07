import React, { useEffect, useRef } from 'react'
import ChatMessages from '../components/chat/ChatMessages'
import PromptInput from '../components/chat/PromptInput'
import { useChatStore } from '../store/chatStore'
import { generateService } from '../services/generateService'
import { chatService } from '../services/chatService'
import { assetService } from '../services/assetService'

function ChatPage() {
  const { currentChatId, messages, setMessages, addMessage, updateMessage, loading, setLoading } = useChatStore()
  const wsRef = useRef(null)

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // Load messages whenever currentChatId changes while on this page
  useEffect(() => {
    if (!currentChatId) return
    chatService.getMessages(currentChatId)
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data)
        }
      })
      .catch(() => {})
  }, [currentChatId, setMessages])

  const waitForSocketOpen = (socket) => new Promise((resolve) => {
    if (socket.readyState === WebSocket.OPEN) {
      resolve()
      return
    }
    const timeout = window.setTimeout(resolve, 1500)
    socket.addEventListener('open', () => {
      window.clearTimeout(timeout)
      resolve()
    }, { once: true })
    socket.addEventListener('error', () => {
      window.clearTimeout(timeout)
      resolve()
    }, { once: true })
  })

  const handleSendPrompt = async (prompt, attachmentFile = null) => {
    if (loading) return

    try {
      setLoading(true)

      let chatId = currentChatId
      if (!chatId) {
        const chat = await chatService.createChat()
        chatId = chat.id
        useChatStore.setState((state) => ({
          chats: [chat, ...state.chats],
          currentChatId: chat.id,
          messages: [],
        }))
      }

      const title = prompt.length > 50 ? prompt.slice(0, 50).trimEnd() + '…' : prompt || 'Image upload'
      chatService.renameChat(chatId, title).then((updated) => {
        useChatStore.setState((state) => ({
          chats: state.chats.map((c) => (c.id === chatId ? { ...c, title: updated.title } : c)),
        }))
      }).catch(() => {})

      let imageAttachmentUrl = null
      let attachmentPreviewUrl = null
      if (attachmentFile) {
        attachmentPreviewUrl = URL.createObjectURL(attachmentFile)
        try {
          imageAttachmentUrl = await assetService.uploadImage(attachmentFile, chatId)
        } catch (err) {
          console.error('Failed to upload attachment:', err)
        }
      }

      addMessage({
        role: 'user',
        content: prompt,
        media: attachmentPreviewUrl ? [{ type: 'image', url: attachmentPreviewUrl }] : [],
        created_at: new Date().toISOString(),
      })

      const progressIndex = useChatStore.getState().messages.length
      addMessage({
        role: 'assistant',
        content: 'Starting generation...',
        created_at: new Date().toISOString(),
      })

      const startedRun = await generateService.start(chatId, prompt, imageAttachmentUrl)
      const socket = generateService.connectWebSocket(startedRun.run_id)
      wsRef.current = socket

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'progress') {
            const prefix = data.progress ? `${data.progress}%` : 'Working'
            updateMessage(progressIndex, {
              role: 'assistant',
              content: `${prefix} - ${data.message}`,
              created_at: new Date().toISOString(),
            })
          }
        } catch {
          // Ignore malformed WebSocket messages and keep the current progress text.
        }
      }

      await waitForSocketOpen(socket)
      const result = await generateService.execute(startedRun.run_id, imageAttachmentUrl)
      socket.close()
      wsRef.current = null

      const media = []
      if (result.image_urls?.length > 0) {
        result.image_urls.forEach((url) => media.push({ type: 'image', url }))
      }
      if (result.video_url) {
        media.push({ type: 'video', url: result.video_url })
      }

      try {
        const freshMessages = await chatService.getMessages(chatId)
        if (Array.isArray(freshMessages) && freshMessages.length > 0) {
          setMessages(freshMessages)
        } else {
          addMessage({
            role: 'assistant',
            content: (result.status === 'completed' || result.status === 'succeeded') ? 'Generation complete.' : `Status: ${result.status}`,
            media,
            created_at: new Date().toISOString(),
          })
        }
      } catch {
        addMessage({
          role: 'assistant',
          content: result.status === 'completed' ? 'Generation complete.' : `Status: ${result.status}`,
          media,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Failed to generate:', error)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      addMessage({
        role: 'assistant',
        content: `Error: ${error?.response?.data?.detail || error.message || 'Generation failed'}`,
        created_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex-1 flex flex-col min-w-0 max-w-3xl mx-auto w-full">
        <ChatMessages messages={messages} loading={loading} />
        <PromptInput onSubmit={handleSendPrompt} disabled={loading} />
      </div>
    </div>
  )
}

export default ChatPage
