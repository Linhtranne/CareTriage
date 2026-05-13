import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import ChatHistoryList from './ChatHistoryList';
import useChat from '../../hooks/useChat';
import chatApi from '../../api/chatApi';
import useAuthStore from '../../store/authStore';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentSessionStatus, setCurrentSessionStatus] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isAiOnline, setIsAiOnline] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const {
    messages,
    sendMessage,
    isTyping,
    isConnected,
    isLoadingHistory,
    hasMore,
    loadMoreMessages,
    status
  } = useChat(sessionId);

  const latestAiSessionStatus = useMemo(() => {
    const latestAiMessage = [...messages].reverse().find((message) => message.senderType === 'AI' && message.metadata);
    if (!latestAiMessage?.metadata) return null;

    try {
      const metadata = typeof latestAiMessage.metadata === 'string'
        ? JSON.parse(latestAiMessage.metadata)
        : latestAiMessage.metadata;

      return metadata?.is_complete ? 'COMPLETED' : null;
    } catch {
      return null;
    }
  }, [messages]);

  const effectiveSessionStatus = latestAiSessionStatus || currentSessionStatus;
  const isSessionReady = Boolean(sessionId) && !sessionLoading && effectiveSessionStatus === 'ACTIVE';

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      setSessionLoading(true);
      try {
        const session = await chatApi.getOrCreateSession();
        if (session?.id) {
          setSessionId(session.id);
          setCurrentSessionStatus(session.status || 'ACTIVE');
        }
      } catch (err) {
        console.error('[ChatWidget] Failed to load chat session:', err);
      } finally {
        setSessionLoading(false);
      }
    };

    const checkHealth = async () => {
      const online = await chatApi.checkAiHealth();
      setIsAiOnline(online);
    };

    init();
    checkHealth();

    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);
  const handleOpenHistory = () => {
    setShowHistory(true);
  };



  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleSelectSession = (session) => {
    if (!session?.id) return;
    setSessionId(session.id);
    setCurrentSessionStatus(session.status || 'ACTIVE');
    setShowHistory(false);
  };

  const handleNewChat = async () => {
    if (sessionLoading) return;

    setSessionLoading(true);
    try {
      const session = await chatApi.createSession();
      if (session?.id) {
        setSessionId(session.id);
        setCurrentSessionStatus(session.status || 'ACTIVE');
        setShowHistory(false);
      }
    } catch (err) {
      console.error('[ChatWidget] Failed to create chat session:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleUploadAttachment = async (file) => {
    if (!sessionId || sessionLoading || effectiveSessionStatus !== 'ACTIVE') return;

    setIsUploadingAttachment(true);
    try {
      await chatApi.uploadAttachment(sessionId, file);
    } catch (err) {
      console.error('[ChatWidget] Failed to upload attachment:', err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[999]">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.5)] hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <MessageCircle size={26} strokeWidth={1.8} />
            </button>

            {isAiOnline && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white"
              />
            )}

            {sessionLoading && (
              <span className="absolute -top-1 -right-1 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[400px] sm:h-[680px] sm:max-h-[calc(100vh-4rem)] flex flex-col bg-white sm:rounded-[16px] shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden z-[1000] border border-slate-100"
          >
            <ChatWindow
              key={sessionId ?? 'new-chat'}
              isOpen={isOpen}
              onClose={() => {
                setIsOpen(false);
                setShowHistory(false);
              }}
              onOpenHistory={handleOpenHistory}
              onNewChat={handleNewChat}
              onUploadAttachment={handleUploadAttachment}
              messages={messages}
              onSendMessage={sendMessage}
              isTyping={isTyping}
              isConnected={isConnected}
              isLoadingHistory={isLoadingHistory}
              hasMore={hasMore}
              loadMoreMessages={loadMoreMessages}
              status={status}
              isAiOnline={isAiOnline}
              isSessionReady={isSessionReady}
              isSessionLoading={sessionLoading}
              isUploadingAttachment={isUploadingAttachment}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && showHistory && (
          <motion.div
            key="chat-history"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[400px] sm:h-[680px] sm:max-h-[calc(100vh-4rem)] flex flex-col bg-white sm:rounded-[16px] shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden z-[1001] border border-slate-100"
          >
            <ChatHistoryList
              onSelectSession={handleSelectSession}
              currentSessionId={sessionId}
              onClose={handleCloseHistory}
              onNewChat={handleNewChat}
              isCreatingSession={sessionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
