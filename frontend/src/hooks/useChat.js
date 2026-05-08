import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from './useWebSocket';
import chatApi from '../api/chatApi';

const useChat = (sessionId) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const typingTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);
  const seenIdsRef = useRef(new Set()); // Track tất cả message ID đã thấy

  const { send, isConnected, status, subscribe } = useWebSocket();

  // Reset khi sessionId thay đổi
  useEffect(() => {
    if (!sessionId) return;
    setPage(0);
    setMessages([]);
    setHasMore(true);
    seenIdsRef.current = new Set(); // Reset seen IDs khi đổi session
    loadMessages(0, sessionId);
  }, [sessionId]);

  // Subscribe vào topic khi BOTH sessionId VÀ isConnected sẵn sàng
  useEffect(() => {
    if (!sessionId || !isConnected) return;

    // Hủy subscription cũ nếu có (khi sessionId thay đổi)
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    console.log('[Chat] Subscribing to /topic/chat/' + sessionId);
    subscriptionRef.current = subscribe(`/topic/chat/${sessionId}`, (msg) => {
      if (msg.type === 'TYPING') {
        setIsTyping(true);
        // Không dùng setTimeout để tự tắt nữa, cứ giữ nguyên 
        // cho đến khi có tin nhắn thật (chạy vào block bên dưới)
        return;
      }

      // Chỉ tắt typing khi AI thực sự gửi tin nhắn lại
      if (msg.senderType === 'AI' || msg.senderType === 'SYSTEM') {
        setIsTyping(false);
      }

      setMessages((prev) => {
        // Xử lý Optimistic UI: Khi nhận lại tin của chính mình từ server
        if (msg.senderType === 'USER') {
          // Tìm tin nhắn tạm đang ở trạng thái SENDING có cùng nội dung
          const optimisticIndex = prev.findIndex(m => m.isOptimistic && m.content === msg.content);
          if (optimisticIndex !== -1) {
             const newMessages = [...prev];
             // Thay thế tin nhắn tạm bằng tin nhắn thật từ server
             newMessages[optimisticIndex] = { ...msg, status: 'DELIVERED' }; 
             if (msg.id) seenIdsRef.current.add(msg.id);
             return newMessages;
          }
        }

        // Dedup bình thường cho các tin khác (AI, System)
        if (msg.id) {
          if (seenIdsRef.current.has(msg.id)) return prev;
          seenIdsRef.current.add(msg.id);
        } else {
          const last = prev[prev.length - 1];
          if (last && last.content === msg.content && last.senderType === msg.senderType && !last.isOptimistic) return prev;
        }
        return [...prev, msg];
      });
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        console.log('[Chat] Unsubscribed from /topic/chat/' + sessionId);
      }
    };
  }, [sessionId, isConnected]); // Re-subscribe khi sessionId hoặc connection state thay đổi

  const loadMessages = async (pageNumber, sid) => {
    const targetSession = sid || sessionId;
    if (!targetSession) return;
    try {
      setIsLoadingHistory(true);
      const res = await chatApi.getHistory(targetSession, pageNumber, 20);
      const data = res.data;
      const newMessages = data?.content || (Array.isArray(data) ? data : []);

      if (newMessages.length < 20) setHasMore(false);

      setMessages((prev) => {
        // Lọc những tin chưa có trong seenIds
        const unique = newMessages.filter(m => {
          if (!m.id) return true;
          if (seenIdsRef.current.has(m.id)) return false;
          seenIdsRef.current.add(m.id);
          return true;
        });
        return [...unique.reverse(), ...prev];
      });
    } catch (err) {
      console.error('[Chat] Failed to load messages', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadMoreMessages = useCallback(() => {
    if (!isLoadingHistory && hasMore && sessionId) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage, sessionId);
    }
  }, [isLoadingHistory, hasMore, page, sessionId]);

  const sendMessage = useCallback((content) => {
    if (!isConnected || !sessionId) {
      console.warn('[Chat] Cannot send: not connected or no session');
      return;
    }

    // 1. Optimistic UI: Thêm ngay tin nhắn tạm vào giao diện
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderType: 'USER',
      status: 'SENDING',
      createdAt: new Date().toISOString(),
      isOptimistic: true // Cờ đánh dấu để reconcile sau
    };
    setMessages(prev => [...prev, tempMessage]);
    setIsTyping(true); // <--- Bật typing indicator của AI ngay lập tức

    // 2. Gửi qua WebSocket
    send('/app/chat.sendMessage', {
      sessionId,
      content,
      senderType: 'USER'
    });
  }, [sessionId, isConnected, send]);

  return {
    messages,
    sendMessage,
    loadMoreMessages,
    isTyping,
    isConnected,
    isLoadingHistory,
    hasMore,
    status
  };
};

export default useChat;
