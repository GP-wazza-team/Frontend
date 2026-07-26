import React, { useEffect, useRef, useState } from 'react'
import ChatMessages from '../components/chat/ChatMessages'
import PromptInput from '../components/chat/PromptInput'
import ScenePlanner from '../components/chat/ScenePlanner'
import SceneImageReview from '../components/chat/SceneImageReview'
import { useChatStore } from '../store/chatStore'
import { generateService } from '../services/generateService'
import { chatService } from '../services/chatService'
import { assetService } from '../services/assetService'

function ChatPage() {
  const { currentChatId, messages, setMessages, addMessage, updateMessage, loading, setLoading } = useChatStore()
  const wsRef = useRef(null)
  const [pipeline, setPipeline] = useState(null) // { runId, imageAttachmentUrl, scenes, reasoning, stage, currentScene }
  const [actionLoading, setActionLoading] = useState(false)

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

  const closeSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const handlePipelineError = (error) => {
    console.error('Generation failed:', error)
    closeSocket()
    addMessage({
      role: 'assistant',
      content: `Error: ${error?.response?.data?.detail || error.message || 'Generation failed'}`,
      created_at: new Date().toISOString(),
    })
    setPipeline(null)
    setLoading(false)
  }

  const finishPipeline = async (chatId) => {
    closeSocket()
    setPipeline(null)
    try {
      const freshMessages = await chatService.getMessages(chatId)
      if (Array.isArray(freshMessages) && freshMessages.length > 0) {
        setMessages(freshMessages)
      }
    } catch {
      // Keep locally-built messages if the refresh fails
    } finally {
      setLoading(false)
    }
  }

  const generateSceneImage = async (runId, sceneNumber, imageAttachmentUrl) => {
    const scene = await generateService.generateSceneImage(
      runId,
      sceneNumber,
      sceneNumber === 1 ? imageAttachmentUrl : null,
    )
    setPipeline((p) => (p ? { ...p, stage: 'image_review', currentScene: scene } : p))
  }

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

      // Stays open for the whole pipeline (write-script -> per-scene image/video),
      // so every step's progress lands in the same message bubble.
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'progress') {
            const prefix = data.progress ? `${data.progress}%` : 'Working'
            const scenePrefix = data.scene_number ? `Scene ${data.scene_number} - ` : ''
            updateMessage(progressIndex, {
              role: 'assistant',
              content: `${prefix} - ${scenePrefix}${data.message}`,
              created_at: new Date().toISOString(),
            })
          }
        } catch {
          // Ignore malformed WebSocket messages and keep the current progress text.
        }
      }

      await waitForSocketOpen(socket)

      const scriptResp = await generateService.writeScript(startedRun.run_id, imageAttachmentUrl)
      updateMessage(progressIndex, {
        role: 'assistant',
        content: scriptResp.scenes.length > 1
          ? `Script ready — ${scriptResp.scenes.length} scenes. Review below.`
          : 'Ready to generate — review below.',
        created_at: new Date().toISOString(),
      })

      setPipeline({
        runId: startedRun.run_id,
        chatId,
        imageAttachmentUrl,
        scenes: scriptResp.scenes,
        reasoning: scriptResp.reasoning,
        stage: 'script_review',
        currentScene: null,
      })
    } catch (error) {
      handlePipelineError(error)
    }
  }

  const handleApproveScript = async (editedScenes) => {
    if (!pipeline) return
    setActionLoading(true)
    try {
      await generateService.approveScript(pipeline.runId, editedScenes)
      await generateSceneImage(pipeline.runId, editedScenes[0].scene_number, pipeline.imageAttachmentUrl)
    } catch (error) {
      handlePipelineError(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegenerateImage = async (tweakedPrompt) => {
    if (!pipeline?.currentScene) return
    setActionLoading(true)
    try {
      const scene = await generateService.regenerateSceneImage(
        pipeline.runId,
        pipeline.currentScene.scene_number,
        tweakedPrompt,
      )
      setPipeline((p) => (p ? { ...p, currentScene: scene } : p))
    } catch (error) {
      handlePipelineError(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveImage = async () => {
    if (!pipeline?.currentScene) return
    setActionLoading(true)
    try {
      const { scene, has_next_scene: hasNextScene } = await generateService.approveSceneImage(
        pipeline.runId,
        pipeline.currentScene.scene_number,
      )

      const media = []
      if (scene.video_url) {
        media.push({ type: 'video', url: scene.video_url })
      } else if (scene.image_urls?.length) {
        scene.image_urls.forEach((url) => media.push({ type: 'image', url }))
      }
      addMessage({
        role: 'assistant',
        content: pipeline.scenes.length > 1 ? `Scene ${scene.scene_number} complete.` : 'Generation complete.',
        media,
        created_at: new Date().toISOString(),
      })

      if (hasNextScene) {
        await generateSceneImage(pipeline.runId, scene.scene_number + 1, null)
      } else {
        await finishPipeline(pipeline.chatId)
      }
    } catch (error) {
      handlePipelineError(error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex-1 flex flex-col min-w-0 max-w-3xl mx-auto w-full">
        <ChatMessages messages={messages} loading={loading && !pipeline} />

        {pipeline?.stage === 'script_review' && (
          <div className="px-4 pb-3">
            <ScenePlanner
              scenes={pipeline.scenes}
              reasoning={pipeline.reasoning}
              onApprove={handleApproveScript}
              loading={actionLoading}
            />
          </div>
        )}

        {pipeline?.stage === 'image_review' && pipeline.currentScene && (
          <div className="px-4 pb-3">
            <SceneImageReview
              scene={pipeline.currentScene}
              totalScenes={pipeline.scenes.length}
              onApprove={handleApproveImage}
              onRegenerate={handleRegenerateImage}
              loading={actionLoading}
            />
          </div>
        )}

        <PromptInput onSubmit={handleSendPrompt} disabled={loading} />
      </div>
    </div>
  )
}

export default ChatPage
