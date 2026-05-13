import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from './useWebSocket';
import notificationApi from '../api/notificationApi';
import useAuthStore from '../store/authStore';

const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { subscribe, isConnected, connectionId } = useWebSocket();
  const { user } = useAuthStore();
  const subscriptionRef = useRef(null);

  // Fetch initial data
  const hydrate = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [countRes, recentRes] = await Promise.all([
        notificationApi.getUnreadCount(),
        notificationApi.getRecent(10)
      ]);
      setUnreadCount(countRes.data || 0);
      setNotifications(recentRes.data || []);
    } catch (err) {
      console.error('[Notifications] Failed to hydrate:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Handle incoming notification via WebSocket
  const handleIncomingNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Tránh duplicate nếu message tới nhanh hơn REST hoặc re-subscribe
      if (prev.find(n => n.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, 20); // Keep last 20
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  // WebSocket Subscription
  useEffect(() => {
    if (!isConnected || connectionId === 0 || !user) return;

    console.log(`[Notifications] Subscribing to /user/queue/notifications (connection #${connectionId})`);
    // Spring STOMP convertToUser gửi tới /user/queue/notifications 
    // thực tế client subscribe tới /user/queue/notifications
    const sub = subscribe('/user/queue/notifications', (msg) => {
      handleIncomingNotification(msg);
    });

    if (sub) {
      subscriptionRef.current = sub;
    }

    return () => {
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch { /* ignore */ }
        subscriptionRef.current = null;
      }
    };
  }, [isConnected, connectionId, user, subscribe, handleIncomingNotification]);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Failed to mark all as read:', err);
    }
  };

  return {
    unreadCount,
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: hydrate
  };
};

export default useNotifications;
