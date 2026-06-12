import { type CSSProperties, type ReactNode, useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { keyframes } from '@emotion/react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Send, Plus, Edit2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TRIAGE_COPY_KEYS, TRIAGE_FALLBACK_COPY, TRIAGE_FALLBACK_COPY_VI } from '../constants/triage-copy'
import { AGENT_COPY_KEYS, AGENT_FALLBACK_COPY, AGENT_FALLBACK_COPY_VI } from '../../agent-session/constants/agent-copy'
import type { ChatMessage, TriageOrbState, TriageProgressState } from '../types/triage-session'
import chatApi from '../../../services/chat-service'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatSessionDTO } from '../types/chat-session-types'

interface AgentConversationPanelProps {
  children?: ReactNode
  className?: string
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  onSendMessage: (text: string) => void
  onRetry: () => void
  onSelectHistorySession?: (ticketId: string) => void
  onNewSession?: () => void
  orbState?: TriageOrbState
  progressState?: TriageProgressState
  isEmergency: boolean
  sessionId: number | null
}

const CHAT_COLUMN_WIDTH = 880
const WORKSPACE_MAX_WIDTH = 'calc(100% - 24px)'
const FLOW_REVIEW_INDEX = 3
const ACTIVE_STEP_SCALE = 1.1
const ACTIVE_STEP_WEIGHT = 700
const INACTIVE_STEP_WEIGHT = 500
const STEP_CONTENT_GAP = 20
const markdownComponents = {
  p: ({ ...props }) => <p style={{ margin: '0 0 10px' }} {...props} />,
  ul: ({ ...props }) => (
    <ul
      style={{
        listStyleType: 'disc',
        margin: '8px 0 10px',
        paddingLeft: 22,
      }}
      {...props}
    />
  ),
  ol: ({ ...props }) => (
    <ol
      style={{
        listStyleType: 'decimal',
        margin: '8px 0 10px',
        paddingLeft: 22,
      }}
      {...props}
    />
  ),
  li: ({ ...props }) => <li style={{ margin: '4px 0', paddingLeft: 2 }} {...props} />,
  strong: ({ ...props }) => <strong style={{ fontWeight: 850 }} {...props} />,
  em: ({ ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
  h1: ({ ...props }) => <h3 style={{ fontSize: 20, fontWeight: 850, lineHeight: 1.25, margin: '0 0 10px' }} {...props} />,
  h2: ({ ...props }) => <h3 style={{ fontSize: 18, fontWeight: 850, lineHeight: 1.3, margin: '14px 0 8px' }} {...props} />,
  h3: ({ ...props }) => <h3 style={{ fontSize: 16, fontWeight: 850, lineHeight: 1.35, margin: '12px 0 8px' }} {...props} />,
  code: ({ ...props }) => (
    <code
      style={{
        background: 'var(--color-surface-100)',
        border: '1px solid var(--color-surface-200)',
        borderRadius: 6,
        fontSize: '0.92em',
        padding: '1px 5px',
      }}
      {...props}
    />
  ),
  pre: ({ ...props }) => (
    <pre
      style={{
        background: 'var(--color-surface-100)',
        border: '1px solid var(--color-surface-200)',
        borderRadius: 12,
        margin: '10px 0',
        overflowX: 'auto',
        padding: 12,
      }}
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <a
      target="_blank"
      rel="noreferrer"
      style={{
        color: 'var(--color-primary-700)',
        fontWeight: 750,
        textDecoration: 'underline',
        textUnderlineOffset: 3,
      }}
      {...props}
    />
  ),
}

const bubbleIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const logoIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
`

const composerIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export default function AgentConversationPanel({
  children,
  className = '',
  messages,
  isLoading,
  error,
  onSendMessage,
  onRetry,
  onSelectHistorySession,
  onNewSession,
  orbState = 'collecting',
  progressState,
  isEmergency,
  sessionId,
}: AgentConversationPanelProps) {
  const { t, i18n } = useTranslation()
  const hasHistoryRail = useMediaQuery('(min-width:1280px)')
  const [inputValue, setInputValue] = useState('')
  const [isComposerFocused, setIsComposerFocused] = useState(false)
  const [historySessions, setHistorySessions] = useState<ChatSessionDTO[]>([])
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editTitleInput, setEditTitleInput] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

  const handleRenameSave = async (id: number) => {
    const trimmedTitle = editTitleInput.trim()
    if (!trimmedTitle || trimmedTitle.length < 1 || trimmedTitle.length > 200) {
      alert(t('agentTriage.renameLengthError', 'Tiêu đề phải từ 1 đến 200 ký tự.'))
      return
    }

    setIsRenaming(true)
    const originalSessions = [...historySessions]

    // Optimistic Update
    setHistorySessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: trimmedTitle } : s))
    )
    setEditingSessionId(null)

    try {
      await chatApi.updateSessionTitle(id, trimmedTitle)
      const sessions = await chatApi.getSessions()
      setHistorySessions(sessions)
    } catch (err) {
      console.error('Failed to rename session:', err)
      setHistorySessions(originalSessions)
      alert(t('agentTriage.renameFailedError', 'Đổi tên cuộc hội thoại thất bại. Vui lòng thử lại.'))
    } finally {
      setIsRenaming(false)
    }
  }
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const triageCopy = i18n.language?.startsWith('vi') ? TRIAGE_FALLBACK_COPY_VI : TRIAGE_FALLBACK_COPY
  const agentCopy = i18n.language?.startsWith('vi') ? AGENT_FALLBACK_COPY_VI : AGENT_FALLBACK_COPY
  const hasOnlyGreeting = messages.length === 1 && messages[0]?.role === 'assistant'
  const normalizedProgressState = progressState ?? {
    intakeComplete: false,
    redFlagDetected: false,
    urgencyLevel: 'LOW',
    missingInformation: [],
  }
  const userMsgCount = messages.filter(m => m.role === 'user').length

  const flowSteps = [
    {
      key: TRIAGE_COPY_KEYS.steps.symptoms,
      label: triageCopy.steps.symptoms,
      complete: userMsgCount > 0,
    },
    {
      key: TRIAGE_COPY_KEYS.steps.history,
      label: triageCopy.steps.history,
      complete: userMsgCount > 1,
    },
    {
      key: TRIAGE_COPY_KEYS.steps.details,
      label: triageCopy.steps.details,
      complete: normalizedProgressState.intakeComplete,
    },
    {
      key: TRIAGE_COPY_KEYS.steps.review,
      label: triageCopy.steps.review,
      complete: normalizedProgressState.intakeComplete || orbState === 'ready' || orbState === 'emergency',
    },
  ]
  const activeFlowIndex = orbState === 'emergency' || normalizedProgressState.intakeComplete
    ? FLOW_REVIEW_INDEX
    : userMsgCount === 0
      ? 0
      : userMsgCount === 1
        ? 1
        : 2

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, error])

  useEffect(() => {
    let isMounted = true

    const loadHistorySessions = async () => {
      setIsHistoryLoading(true)
      setHistoryError(false)
      try {
        const sessions = await chatApi.getSessions()
        if (isMounted) setHistorySessions(sessions)
      } catch {
        if (isMounted) setHistoryError(true)
      } finally {
        if (isMounted) setIsHistoryLoading(false)
      }
    }

    void loadHistorySessions()

    return () => {
      isMounted = false
    }
  }, [sessionId])

  const getQuickReplyLabel = (replyKey: string) => {
    const fallbackKey = replyKey.split('.').pop() as keyof typeof triageCopy.quickReplies
    return t(replyKey, triageCopy.quickReplies[fallbackKey])
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || isLoading || isEmergency) return
    onSendMessage(text)
    setInputValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const workspaceStyle: CSSProperties = {
    display: 'grid',
    gap: 24,
    gridTemplateColumns: hasHistoryRail
      ? 'minmax(0, 4fr) minmax(0, 1fr)'
      : `minmax(0, ${CHAT_COLUMN_WIDTH}px)`,
    marginInline: 'auto',
    maxWidth: hasHistoryRail ? WORKSPACE_MAX_WIDTH : CHAT_COLUMN_WIDTH,
    width: '100%',
  }
  const assistantAvatar = (
    <span
      aria-label={t(AGENT_COPY_KEYS.aiLabel, agentCopy.aiLabel)}
      style={{
        alignItems: 'center',
        animation: `${logoIn} 220ms cubic-bezier(0.16, 1, 0.3, 1) both`,
        background: 'var(--color-surface-50)',
        border: '1px solid var(--color-surface-200)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexShrink: 0,
        height: 40,
        justifyContent: 'center',
        width: 40,
      }}
    >
      <img
        src="/gemini-svg.svg"
        alt=""
        aria-hidden="true"
        style={{
          display: 'block',
          height: 24,
          width: 24,
        }}
      />
    </span>
  )
  const assistantBubbleStyle: CSSProperties = {
    animation: `${bubbleIn} 180ms cubic-bezier(0.16, 1, 0.3, 1) both`,
    background: 'var(--color-clear)',
    border: 0,
    borderRadius: 0,
    boxShadow: 'none',
    color: 'var(--color-surface-800)',
    display: 'block',
    lineHeight: 1.75,
    minHeight: 0,
    overflow: 'visible',
    padding: '2px 0 0',
    wordBreak: 'break-word',
  }
  const userBubbleStyle: CSSProperties = {
    animation: `${bubbleIn} 180ms cubic-bezier(0.16, 1, 0.3, 1) both`,
    background: 'var(--color-primary-600)',
    border: 'none',
    borderRadius: '18px 18px 6px 18px',
    boxShadow: 'var(--shadow-card)',
    color: 'var(--color-surface-50)',
    display: 'block',
    lineHeight: 1.75,
    minHeight: 48,
    overflow: 'visible',
    padding: '14px 20px 15px',
    wordBreak: 'break-word',
  }

  return (
    <section
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        width: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 12px 8px',
        }}
      >
        <div
          style={workspaceStyle}
        >
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: hasOnlyGreeting ? 'flex-end' : 'flex-start',
            }}
          >
            {hasOnlyGreeting ? (
              <div style={{ paddingBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {assistantAvatar}
                  <div style={{ maxWidth: 760 }}>
                    <p
                      className="text-xs font-black uppercase"
                      style={{
                        color: 'var(--color-primary-700)',
                        margin: 0,
                      }}
                    >
                      {t(TRIAGE_COPY_KEYS.pageTitle, triageCopy.pageTitle)}
                    </p>
                    <h1
                      style={{
                        color: 'var(--color-surface-900)',
                        fontSize: '1.875rem',
                        fontWeight: 850,
                        lineHeight: 1.18,
                        margin: '8px 0 0',
                      }}
                    >
                      {t(TRIAGE_COPY_KEYS.greetingDescription, triageCopy.greetingDescription)}
                    </h1>
                    <p
                      style={{
                        color: 'var(--color-surface-600)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: '12px 0 0',
                      }}
                    >
                      {t(TRIAGE_COPY_KEYS.greeting, triageCopy.greeting)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {messages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      assistantAvatar
                    )}
                    <div
                      className="max-w-[min(720px,82%)] text-sm"
                      style={message.role === 'user' ? userBubbleStyle : assistantBubbleStyle}
                    >
                      <div
                        style={{
                          overflowWrap: 'anywhere',
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="mt-5 flex items-center gap-3 text-sm" style={{ color: 'var(--color-surface-600)' }}>
                {assistantAvatar}
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                </span>
              </div>
            )}

            {error && (
              <div
                className="mt-5 text-sm"
                style={{
                  animation: `${bubbleIn} 180ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  background: 'var(--color-danger-50)',
                  border: '1px solid var(--color-danger-100)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow-card)',
                  color: 'var(--color-danger-700)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  lineHeight: 1.65,
                  maxWidth: 720,
                  padding: '16px 20px 18px',
                }}
              >
                <p style={{ margin: 0 }}>{error}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-bold transition-colors"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'var(--color-clear)',
                    border: 0,
                    color: 'var(--color-danger-700)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    lineHeight: 1.4,
                    minHeight: 28,
                    padding: '4px 0',
                  }}
                >
                  {t('agentTriage.retry', triageCopy.retry)}
                </button>
              </div>
            )}

            {children}
            <div ref={messagesEndRef} />
          </div>

          {hasHistoryRail && (
            <aside
              aria-label={triageCopy.historyTitle}
              style={{
                alignSelf: 'start',
                position: 'sticky',
                top: 12,
                background: 'var(--color-surface-50)',
                border: '1px solid var(--color-surface-200)',
                borderRadius: 20,
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden',
                padding: 18,
                maxHeight: 'calc(100vh - 40px)',
              }}
            >
            <div
              style={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p
                    style={{
                      color: 'var(--color-primary-700)',
                      fontSize: 12,
                      fontWeight: 850,
                      margin: 0,
                      textTransform: 'uppercase',
                    }}
                  >
                    {triageCopy.historyTitle}
                  </p>
                  <p
                    style={{
                      color: 'var(--color-surface-500)',
                      fontSize: 12,
                      fontWeight: 700,
                      margin: '4px 0 0',
                    }}
                  >
                    {triageCopy.currentSession}
                  </p>
                </div>
                {onNewSession && (
                  <button
                    onClick={onNewSession}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--color-primary-50)',
                      color: 'var(--color-primary-700)',
                      border: 'none',
                      borderRadius: 12,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-100)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    {t('agentTriage.newSession', 'Phiên mới')}
                  </button>
                )}
              </div>

              {isHistoryLoading ? (
                <div
                  style={{
                    background: 'var(--color-surface-50)',
                    border: '1px solid var(--color-surface-200)',
                    borderRadius: 16,
                    color: 'var(--color-surface-600)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: 14,
                  }}
                >
                  {triageCopy.historyLoading}
                </div>
              ) : historyError ? (
                <div
                  style={{
                    background: 'var(--color-danger-50)',
                    border: '1px solid var(--color-danger-100)',
                    borderRadius: 16,
                    color: 'var(--color-danger-700)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: 14,
                  }}
                >
                  {triageCopy.historyError}
                </div>
              ) : historySessions.length === 0 ? (
                <div
                  style={{
                    background: 'var(--color-surface-50)',
                    border: '1px solid var(--color-surface-200)',
                    borderRadius: 16,
                    color: 'var(--color-surface-600)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: 14,
                  }}
                >
                  {triageCopy.historyEmpty}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    minWidth: 0,
                    overflowY: 'auto',
                    flex: 1,
                    paddingRight: 4,
                  }}
                >
                  {historySessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        if (onSelectHistorySession) {
                          onSelectHistorySession(session.id.toString())
                          return
                        }
                        setInputValue(session.title || 'Tư vấn sức khỏe')
                      }}
                      style={{
                        background: session.id === sessionId ? 'var(--color-primary-50)' : 'var(--color-surface-50)',
                        border: session.id === sessionId ? '1px solid ' + (session.id === sessionId ? 'var(--color-primary-250)' : 'var(--color-surface-200)') : '1px solid var(--color-surface-200)',
                        borderRadius: 14,
                        color: 'var(--color-surface-800)',
                        cursor: 'pointer',
                        fontSize: 13,
                        lineHeight: 1.5,
                        minWidth: 0,
                        overflow: 'hidden',
                        padding: 12,
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {editingSessionId === session.id ? (
                        <div 
                          style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            disabled={isRenaming}
                            style={{
                              flex: 1,
                              background: 'var(--color-surface-50)',
                              border: '1px solid var(--color-surface-300)',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: 12,
                              color: 'var(--color-surface-800)',
                              outline: 'none',
                              minWidth: 0,
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleRenameSave(session.id);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void handleRenameSave(session.id)}
                            disabled={isRenaming}
                            style={{
                              background: 'var(--color-primary-600)',
                              color: 'var(--color-surface-50)',
                              border: 'none',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                display: 'block',
                                fontWeight: 800,
                                lineHeight: 1.45,
                                overflowWrap: 'anywhere',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                              }}
                            >
                              {session.title || 'Tư vấn sức khỏe'}
                            </span>
                            <span
                              style={{
                                color: 'var(--color-surface-500)',
                                display: 'block',
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {new Date(session.createdAt).toLocaleDateString(i18n.language)}
                            </span>
                          </div>
                          {session.id === sessionId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(session.id);
                                setEditTitleInput(session.title || 'Tư vấn sức khỏe');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-surface-500)',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Đổi tên"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Progress Flow UI */}
            <div style={{ marginTop: 24, borderTop: '1px solid var(--color-surface-200)', paddingTop: 20 }}>
              <p
                style={{
                  color: 'var(--color-primary-700)',
                  fontSize: 12,
                  fontWeight: 850,
                  margin: '0 0 16px',
                  textTransform: 'uppercase',
                }}
              >
                {t('agentTriage.progress', 'Progress')}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {flowSteps.map((step, index) => {
                  const isActive = index === activeFlowIndex;
                  const isCompleted = index < activeFlowIndex || step.complete;
                  const isLast = index === flowSteps.length - 1;
                  
                  return (
                    <div key={step.key} style={{ display: 'flex', position: 'relative' }}>
                      {/* Cột icon và line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                        <motion.div 
                          initial={false}
                          animate={{ 
                            scale: isActive ? ACTIVE_STEP_SCALE : 1
                          }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          style={{ 
                            width: 22, 
                            height: 22, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: isCompleted ? 'var(--color-success)' : isActive ? 'var(--color-primary-600)' : 'var(--color-surface-200)',
                            color: 'var(--color-surface-50)',
                            zIndex: 1,
                            marginTop: 2,
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {isCompleted ? (
                              <motion.svg 
                                key="completed"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </motion.svg>
                            ) : isActive ? (
                              <motion.div 
                                key="active"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-surface-50)' }} 
                              />
                            ) : (
                              <motion.div 
                                key="inactive"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-surface-400)' }} 
                              />
                            )}
                          </AnimatePresence>
                        </motion.div>
                        
                        {!isLast && (
                          <div 
                            style={{ 
                              width: 2, 
                              flexGrow: 1,
                              minHeight: 16,
                              marginTop: 4,
                              marginBottom: 4,
                              zIndex: 0,
                              backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-surface-200)',
                              transition: 'background-color 0.4s ease'
                            }} 
                          />
                        )}
                      </div>
                      
                      {/* Nội dung text */}
                      <motion.div 
                        initial={false}
                        animate={{
                          color: isActive ? 'var(--color-surface-900)' : isCompleted ? 'var(--color-surface-700)' : 'var(--color-surface-500)',
                          fontWeight: isActive ? ACTIVE_STEP_WEIGHT : INACTIVE_STEP_WEIGHT
                        }}
                        style={{ 
                          marginLeft: 12, 
                          paddingBottom: isLast ? 0 : STEP_CONTENT_GAP,
                          fontSize: 14,
                          lineHeight: 1.5,
                          paddingTop: 3
                        }}
                      >
                        {t(step.key, step.label)}
                        
                        {/* Expandable sub-text cho active state */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <span style={{ fontSize: 12, color: 'var(--color-primary-600)', fontWeight: 600 }}>
                                {isCompleted ? 'Đang hoàn thiện...' : 'Đang thu thập thông tin...'}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              
              {/* Note: Auto-navigation and ticket status is handled at triage-page.tsx level */}
            </div>
            </aside>
          )}
        </div>
      </div>

      <div
        style={{
          padding: '10px 12px 14px',
        }}
      >
        <div style={workspaceStyle}>
          <div>
          <div
            className="shadow-sm"
            style={{
              animation: `${composerIn} 220ms cubic-bezier(0.16, 1, 0.3, 1) both`,
              borderRadius: 26,
              borderColor: isComposerFocused ? 'var(--color-primary-300)' : 'var(--color-surface-200)',
              borderStyle: 'solid',
              borderWidth: 1,
              background: 'var(--color-surface-50)',
              boxShadow: isComposerFocused ? 'var(--orb-ready-glow)' : 'var(--shadow-card)',
              transition: 'border-color 160ms ease-out, box-shadow 160ms ease-out, transform 160ms ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '14px 16px 0',
              }}
            >
              {TRIAGE_COPY_KEYS.quickReplies.map((replyKey) => (
                <button
                  key={replyKey}
                  type="button"
                  onClick={() => setInputValue(getQuickReplyLabel(replyKey))}
                  disabled={isLoading || isEmergency}
                  className="rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-700)',
                    padding: '4px 8px',
                  }}
                >
                  {getQuickReplyLabel(replyKey)}
                </button>
              ))}
            </div>

            {hasOnlyGreeting && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  padding: '8px 16px 0',
                }}
              >
                {triageCopy.promptCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => setInputValue(card.prompt)}
                    className="transition-colors disabled:opacity-50"
                    disabled={isLoading || isEmergency}
                    style={{
                      background: 'var(--color-surface-100)',
                      border: '1px solid var(--color-surface-200)',
                      borderRadius: 10,
                      color: 'var(--color-surface-700)',
                      fontSize: 12,
                      fontWeight: 750,
                      padding: '5px 9px',
                    }}
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px 14px 16px',
              }}
            >
              <textarea
                rows={1}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsComposerFocused(false)}
                onFocus={() => setIsComposerFocused(true)}
                disabled={isLoading || isEmergency}
                placeholder={
                  isEmergency
                    ? t('agentTriage.emergencyAction', triageCopy.emergencyAction)
                    : t('agentTriage.inputPlaceholder', triageCopy.inputPlaceholder)
                }
                className="resize-none bg-transparent text-sm disabled:opacity-60"
                style={{
                  border: 0,
                  boxShadow: 'none',
                  color: 'var(--color-surface-900)',
                  lineHeight: 1.6,
                  maxHeight: 144,
                  minHeight: 38,
                  outline: 'none',
                  padding: '7px 2px',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || isEmergency}
                className="inline-flex items-center justify-center transition-opacity disabled:opacity-40"
                style={{
                  background: 'var(--color-primary-600)',
                  border: 0,
                  borderRadius: 16,
                  color: 'var(--color-surface-50)',
                  cursor: inputValue.trim() && !isLoading && !isEmergency ? 'pointer' : 'default',
                  height: 46,
                  width: 46,
                }}
                aria-label={t('agentTriage.send', triageCopy.send)}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
