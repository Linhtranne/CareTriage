import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from './use-web-socket';
import chatApi from '../services/chat-service';

const getMessageTime = (message) => {
  const time = new Date(message.createdAt || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortMessagesByTime = (messages) => [...messages].sort((a, b) => getMessageTime(a) - getMessageTime(b));

const mergeChatMessage = (messages, msg) => {
  const merged = [...messages];
  const id = msg.id != null ? String(msg.id) : null;
  const existingIdIndex = id
    ? merged.findIndex((item) => item.id != null && String(item.id) === id)
    : -1;
  const optimisticIndex = msg.senderType === 'USER'
    ? merged.findIndex((item) => item.isOptimistic && item.senderType === 'USER' && item.content === msg.content)
    : -1;

  if (existingIdIndex !== -1) {
    merged[existingIdIndex] = { ...merged[existingIdIndex], ...msg, isOptimistic: false };
    if (optimisticIndex !== -1 && optimisticIndex !== existingIdIndex) {
      merged.splice(optimisticIndex, 1);
    }
    return merged;
  }

  if (optimisticIndex !== -1) {
    merged[optimisticIndex] = { ...msg, status: 'DELIVERED' };
    return merged;
  }

  if (!msg.id) {
    const last = merged[merged.length - 1];
    if (last && last.content === msg.content && last.senderType === msg.senderType && !last.isOptimistic) {
      return merged;
    }
  }

  merged.push(msg);
  return merged;
};

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
  const errorSubscriptionRef = useRef(null);
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
        try { subscriptionRef.current.unsubscribe(); } catch { /* ignore */ }
        subscriptionRef.current = null;
      }
      if (errorSubscriptionRef.current) {
        try { errorSubscriptionRef.current.unsubscribe(); } catch { /* ignore */ }
        errorSubscriptionRef.current = null;
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

      const unique = newMessages.filter((m) => {
        if (!m.id) return true;
        const messageId = String(m.id);
        if (seenIdsRef.current.has(messageId)) return false;
        seenIdsRef.current.add(messageId);
        return true;
      });

      if (unique.length === 0) return;

      setMessages((prev) => sortMessagesByTime(unique.reduce((acc, msg) => mergeChatMessage(acc, msg), prev)));
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
      
      // Update the status of the most recent SENDING message to FAILED
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].status === 'SENDING' && next[i].senderType === 'USER') {
            next[i] = { ...next[i], status: 'FAILED', error: msg.content || 'Gửi tin nhắn thất bại' };
            break;
          }
        }
        return next;
      });
      return;
    }

    // AI/SYSTEM response → stop typing
    if (msg.senderType === 'AI' || msg.senderType === 'SYSTEM') {
      setIsTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    if (msg.id && !seenIdsRef.current.has(String(msg.id))) {
      seenIdsRef.current.add(String(msg.id));
    }

    setMessages((prev) => sortMessagesByTime(mergeChatMessage(prev, msg)));
  }, []);


  // ─── Reset khi sessionId thay đổi ──────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    // Reset state
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    // Subscribe to chat topic
    console.log(`[Chat] Subscribing to /topic/chat/${sessionId} (connection #${connectionId})`);
    const sub = subscribe(`/topic/chat/${sessionId}`, handleWsMessage);
    
    if (sub) {
      subscriptionRef.current = sub;
    } else {
      console.warn('[Chat] Subscribe returned null — client not ready yet');
    }

    // Subscribe to user error queue
    console.log(`[Chat] Subscribing to /user/queue/errors (connection #${connectionId})`);
    const errSub = subscribe('/user/queue/errors', handleWsMessage);
    
    if (errSub) {
      errorSubscriptionRef.current = errSub;
    }

    // Cleanup: unsubscribe khi effect re-runs hoặc unmount
    return () => {
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch { /* connection already dead */ }
        subscriptionRef.current = null;
      }
      if (errorSubscriptionRef.current) {
        try { errorSubscriptionRef.current.unsubscribe(); } catch { /* ignore */ }
        errorSubscriptionRef.current = null;
      }
      console.log(`[Chat] Unsubscribed from topic and error channels (connection #${connectionId})`);
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

  const resendMessage = useCallback((tempId) => {
    const sid = sessionIdRef.current;
    if (!isConnected || !sid) {
      console.warn('[Chat] Cannot resend: not connected');
      return;
    }

    setMessages((prev) => {
      const next = [...prev];
      const msgIdx = next.findIndex(item => item.id === tempId);
      if (msgIdx !== -1) {
        const msg = next[msgIdx];
        next[msgIdx] = { ...msg, status: 'SENDING', error: null };
        
        send('/app/chat.sendMessage', {
          sessionId: sid,
          content: msg.content,
          senderType: 'USER',
        });
      }
      return next;
    });
    setIsTyping(true);
  }, [isConnected, send]);

  const completeTriage = useCallback(async (forceSubmit = false) => {
    const sid = sessionIdRef.current;
    if (!sid) return null;
    setIsTyping(true);
    try {
      const data = await chatApi.completeTriage(sid, forceSubmit);
      return data;
    } catch (err) {
      console.error('[Chat] Failed to complete triage:', err);
      throw err;
    } finally {
      setIsTyping(false);
    }
  }, []);

  return {
    messages,
    sendMessage,
    resendMessage,
    loadMoreMessages,
    completeTriage,
    isTyping,
    isConnected,
    isLoadingHistory,
    hasMore,
    status,
  };
};

export default useChat;
