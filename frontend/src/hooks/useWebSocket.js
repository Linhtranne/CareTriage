
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
    maxReconnectAttempts = 5
  } = config;

  const [status, setStatus] = useState(WS_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [reconnectTick, setReconnectTick] = useState(0);
  
  const clientRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const onConnectCleanupRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const { token } = useAuthStore();

  const disconnect = useCallback(() => {
    setStatus(WS_STATUS.IDLE);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (onConnectCleanupRef.current) {
      onConnectCleanupRef.current();
      onConnectCleanupRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current?.active || status === WS_STATUS.CONNECTED) return;

    setStatus(WS_STATUS.CONNECTING);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const socket = new SockJS(apiBaseUrl + endpoint);
    
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => { if (import.meta.env.DEV) console.log('[WS Debug]:', str); },
      reconnectDelay: 0,
      heartbeatIncoming,
      heartbeatOutgoing,
    });

    client.onConnect = (frame) => {
      console.log('[WS]: Connected');
      setStatus(WS_STATUS.CONNECTED);
      reconnectCountRef.current = 0;
      setError(null);
      if (onConnectCleanupRef.current) onConnectCleanupRef.current();
      if (onConnect) onConnectCleanupRef.current = onConnect(frame, client);
    };

    client.onStompError = (frame) => {
      setError(frame.headers['message']);
      setStatus(WS_STATUS.ERROR);
    };

    client.onWebSocketClose = () => {
      console.log('[WS]: Connection closed');
      if (status !== WS_STATUS.IDLE && status !== WS_STATUS.DISCONNECTED) {
        handleReconnect();
      }
    };

    client.activate();
    clientRef.current = client;
  }, [endpoint, token, heartbeatIncoming, heartbeatOutgoing, onConnect, status]);

  const handleReconnect = useCallback(() => {
    if (reconnectCountRef.current >= maxReconnectAttempts) {
      setStatus(WS_STATUS.DISCONNECTED);
      return;
    }

    setStatus(WS_STATUS.RECONNECTING);
    reconnectCountRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current - 1), 30000);
    
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      setReconnectTick(prev => prev + 1);
    }, delay);
  }, [maxReconnectAttempts]);

  // Trigger connect when reconnectTick changes
  useEffect(() => {
    if (reconnectTick > 0) connect();
  }, [reconnectTick]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [token]); // Re-connect only when token changes or initial mount

  const subscribe = useCallback((destination, callback) => {
    if (!clientRef.current?.connected) return null;
    return clientRef.current.subscribe(destination, (message) => {
      callback(JSON.parse(message.body), message);
    });
  }, []);

  const send = useCallback((destination, body) => {
    if (!clientRef.current?.connected) return false;
    clientRef.current.publish({ destination, body: JSON.stringify(body) });
    return true;
  }, []);

  return {
    status,
    error,
    isConnected: status === WS_STATUS.CONNECTED,
    subscribe,
    send,
    connect,
    disconnect
  };
};

export default useWebSocket;
