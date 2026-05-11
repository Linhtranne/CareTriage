import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import useAuthStore from '../store/authStore';

export const WS_STATUS = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR'
};

const useWebSocket = (config = {}) => {
  const {
    endpoint = '/ws-chat',
    onConnect,
    heartbeatIncoming = 10000,
    heartbeatOutgoing = 10000,
    maxReconnectAttempts = 10
  } = config;

  const [status, setStatus] = useState(WS_STATUS.IDLE);
  const [error, setError] = useState(null);
  // connectionId tăng mỗi lần connect thành công → consumers biết cần re-subscribe
  const [connectionId, setConnectionId] = useState(0);
  
  const clientRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const statusRef = useRef(WS_STATUS.IDLE);
  const mountedRef = useRef(true);
  const { token } = useAuthStore();
  const tokenRef = useRef(token);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const disconnect = useCallback(() => {
    statusRef.current = WS_STATUS.IDLE;
    if (mountedRef.current) setStatus(WS_STATUS.IDLE);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (clientRef.current) {
      try { clientRef.current.deactivate(); } catch (e) { /* ignore */ }
      clientRef.current = null;
    }
  }, []);

  const doConnect = useCallback(() => {
    // Guard
    if (clientRef.current?.active) return;
    if (statusRef.current === WS_STATUS.CONNECTING) return;

    statusRef.current = WS_STATUS.CONNECTING;
    if (mountedRef.current) setStatus(WS_STATUS.CONNECTING);

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    const client = new Client({
      webSocketFactory: () => new SockJS(apiBaseUrl + endpoint),
      connectHeaders: { Authorization: `Bearer ${tokenRef.current}` },
      debug: () => {}, // Silent in production
      reconnectDelay: 0, // We handle reconnect ourselves
      heartbeatIncoming,
      heartbeatOutgoing,
    });

    client.onConnect = () => {
      console.log('[WS] Connected ✓');
      statusRef.current = WS_STATUS.CONNECTED;
      reconnectCountRef.current = 0;
      if (mountedRef.current) {
        setStatus(WS_STATUS.CONNECTED);
        setConnectionId(prev => prev + 1); // Signal consumers to re-subscribe
        setError(null);
      }
    };

    client.onStompError = (frame) => {
      console.error('[WS] STOMP Error:', frame.headers['message']);
      statusRef.current = WS_STATUS.ERROR;
      if (mountedRef.current) {
        setError(frame.headers['message']);
        setStatus(WS_STATUS.ERROR);
      }
    };

    client.onWebSocketClose = () => {
      console.log('[WS] Connection closed');
      clientRef.current = null;

      if (statusRef.current === WS_STATUS.IDLE) return; // Intentional disconnect

      if (reconnectCountRef.current >= maxReconnectAttempts) {
        statusRef.current = WS_STATUS.DISCONNECTED;
        if (mountedRef.current) setStatus(WS_STATUS.DISCONNECTED);
        return;
      }

      statusRef.current = WS_STATUS.RECONNECTING;
      if (mountedRef.current) setStatus(WS_STATUS.RECONNECTING);
      
      reconnectCountRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current - 1), 15000);
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${maxReconnectAttempts})`);
      
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => doConnect(), delay);
    };

    client.activate();
    clientRef.current = client;
  }, [endpoint, heartbeatIncoming, heartbeatOutgoing, maxReconnectAttempts]);

  // Initial connect
  useEffect(() => {
    if (token) doConnect();
    return () => disconnect();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe — must be called when clientRef.current is connected
  const subscribe = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('[WS] Cannot subscribe: not connected');
      return null;
    }
    console.log('[WS] Subscribing to', destination);
    return client.subscribe(destination, (message) => {
      try {
        const parsed = JSON.parse(message.body);
        console.log('[WS] ◄ RECEIVED on', destination, ':', parsed.senderType || parsed.type, parsed.content?.substring(0, 50) || '');
        callback(parsed, message);
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    });
  }, []);

  const send = useCallback((destination, body) => {
    if (!clientRef.current?.connected) {
      console.warn('[WS] Cannot send: not connected');
      return false;
    }
    console.log('[WS] ► SENDING to', destination, ':', body.content?.substring(0, 50) || JSON.stringify(body).substring(0, 80));
    clientRef.current.publish({ destination, body: JSON.stringify(body) });
    return true;
  }, []);

  return {
    status,
    error,
    isConnected: status === WS_STATUS.CONNECTED,
    connectionId, // Consumers use this to know when to re-subscribe
    subscribe,
    send,
    connect: doConnect,
    disconnect
  };
};

export default useWebSocket;
