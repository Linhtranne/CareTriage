import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';
import useChat from '../../hooks/useChat';
import chatApi from '../../api/chatApi';
import useAuthStore from '../../store/authStore';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
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

  // Lấy hoặc tạo session khi user đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      setSessionLoading(true);
      try {
        const session = await chatApi.getOrCreateSession();
        if (session?.id) {
          setSessionId(session.id);
        }
      } catch (err) {
        console.error('[ChatWidget] Failed to init session:', err);
      } finally {
        setSessionLoading(false);
      }
    };

    init();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[999]">
      {/* FAB Button */}
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

            {/* Online dot */}
            {isConnected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white"
              />
            )}

            {/* Loading dot */}
            {sessionLoading && (
              <span className="absolute -top-1 -right-1 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
          </motion.div>

        )}
      </AnimatePresence>

      {/* Chat Window */}
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isTyping={isTyping}
        isConnected={isConnected}
        isLoadingHistory={isLoadingHistory}
        hasMore={hasMore}
        loadMoreMessages={loadMoreMessages}
        status={status}
      />
    </div>
  );
};

export default ChatWidget;