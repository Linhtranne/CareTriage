import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from './useWebSocket';
import chatApi from '../api/chatApi';

/**
 * useChat — quản lý tin nhắn cho 1 chat session.
 * 
 * KEY DESIGN: Dùng `connectionId` từ useWebSocket để biết khi nào WebSocket
 * reconnect → tự động re-subscribe. Đây là cách DUY NHẤT đáng tin cậy
 * để detect reconnection.
 */
const useChat = (sessionId) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const subscriptionRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const typingTimerRef = useRef(null);
  const loadingRef = useRef(false);
  const sessionIdRef = useRef(sessionId);

  const { send, isConnected, status, subscribe, connectionId } = useWebSocket();

  // Keep ref in sync
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch (e) { /* ignore */ }
        subscriptionRef.current = null;
      }
    };
  }, []);

  // ─── Load lịch sử ──────────────────────────────────────────────────────
  const loadMessages = useCallback(async (pageNumber, targetSessionId) => {
    if (!targetSessionId || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingHistory(true);

    try {
      const res = await chatApi.getHistory(targetSessionId, pageNumber, 20);
      
      // Guard: session đã thay đổi trong khi loading
      if (sessionIdRef.current !== targetSessionId) return;

      const data = res.data;
      const newMessages = data?.content || (Array.isArray(data) ? data : []);

      if (newMessages.length < 20) setHasMore(false);

      setMessages((prev) => {
        const unique = newMessages.filter((m) => {
          if (!m.id) return true;
          if (seenIdsRef.current.has(m.id)) return false;
          seenIdsRef.current.add(m.id);
          return true;
        });
        if (unique.length === 0) return prev;
        const reversed = [...unique].reverse();
        return pageNumber > 0 ? [...reversed, ...prev] : reversed;
      });
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    } finally {
      loadingRef.current = false;
      setIsLoadingHistory(false);
    }
  }, []);

  // ─── WebSocket message handler ─────────────────────────────────────────
  const handleWsMessage = useCallback((msg) => {
    // Typing indicator
    if (msg.type === 'TYPING') {
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 30000);
      return;
    }

    // Error from backend
    if (msg.type === 'ERROR') {
      setIsTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      return;
    }

    // AI/SYSTEM response → stop typing
    if (msg.senderType === 'AI' || msg.senderType === 'SYSTEM') {
      setIsTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    // Dedup by ID using ref (outside state updater to prevent StrictMode bugs)
    if (msg.id) {
      if (seenIdsRef.current.has(msg.id)) {
        console.log('[Chat] ✗ DEDUP: msg id', msg.id, 'already seen → SKIPPING');
        return;
      }
      seenIdsRef.current.add(msg.id);
    }

    // Add message
    setMessages((prev) => {
      // Reconcile optimistic USER message
      if (msg.senderType === 'USER') {
        const idx = prev.findIndex((m) => m.isOptimistic && m.content === msg.content);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...msg, status: 'DELIVERED' };
          console.log('[Chat] ✓ Reconciled optimistic USER msg, id:', msg.id);
          return updated;
        }
      }

      // Double check if it somehow exists in prev (pure check)
      if (msg.id && prev.some(m => m.id === msg.id)) {
        return prev;
      }

      // Dedup by content if no ID
      if (!msg.id) {
        const last = prev[prev.length - 1];
        if (last && last.content === msg.content && last.senderType === msg.senderType && !last.isOptimistic) {
          console.log('[Chat] ✗ DEDUP by content → SKIPPING');
          return prev;
        }
      }

      console.log('[Chat] ✓ ADDING message:', msg.senderType, msg.id, '→ new length:', prev.length + 1);
      return [...prev, msg];
    });
  }, []);


  // ─── Reset khi sessionId thay đổi ──────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    // Reset state
    setPage(0);
    setMessages([]);
    setHasMore(true);
    setIsTyping(false);
    seenIdsRef.current = new Set();
    loadingRef.current = false;

    // Load initial history
    loadMessages(0, sessionId);
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── WebSocket Subscription ─────────────────────────────────────────────
  // 
  // Dependencies: [sessionId, connectionId]
  // 
  // connectionId thay đổi MỖI KHI WebSocket connect/reconnect thành công.
  // Khi connectionId thay đổi → cleanup chạy (unsubscribe cũ) → effect chạy 
  // (subscribe mới trên connection mới).
  // 
  // Đây là cách DUY NHẤT đáng tin cậy để xử lý reconnection.
  //
  useEffect(() => {
    if (!sessionId || !isConnected || connectionId === 0) return;

    // Subscribe
    console.log(`[Chat] Subscribing to /topic/chat/${sessionId} (connection #${connectionId})`);
    const sub = subscribe(`/topic/chat/${sessionId}`, handleWsMessage);
    
    if (sub) {
      subscriptionRef.current = sub;
    } else {
      console.warn('[Chat] Subscribe returned null — client not ready yet');
    }

    // Cleanup: unsubscribe khi effect re-runs hoặc unmount
    return () => {
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch (e) { /* connection already dead */ }
        subscriptionRef.current = null;
        console.log(`[Chat] Unsubscribed (connection #${connectionId})`);
      }
    };
  }, [sessionId, connectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Infinite scroll ───────────────────────────────────────────────────
  const loadMoreMessages = useCallback(() => {
    if (loadingRef.current || !hasMore || !sessionIdRef.current) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage, sessionIdRef.current);
  }, [hasMore, page, loadMessages]);

  // ─── Gửi tin nhắn ──────────────────────────────────────────────────────
  const sendMessage = useCallback((content) => {
    const sid = sessionIdRef.current;
    if (!isConnected || !sid) {
      console.warn('[Chat] Cannot send: not connected or no session');
      return;
    }

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderType: 'USER',
      status: 'SENDING',
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setIsTyping(true);

    send('/app/chat.sendMessage', {
      sessionId: sid,
      content,
      senderType: 'USER',
    });
  }, [isConnected, send]);

  return {
    messages,
    sendMessage,
    loadMoreMessages,
    isTyping,
    isConnected,
    isLoadingHistory,
    hasMore,
    status,
  };
};

export default useChat;
