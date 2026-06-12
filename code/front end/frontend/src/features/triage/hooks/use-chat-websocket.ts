import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import useAuthStore from '../../../store/auth-store';

export interface WebSocketMessage {
  type?: string; // 'TYPING', 'ERROR'
  senderType?: string; // 'AI', 'SYSTEM'
  content?: string;
  metadata?: string;
  id?: number;
  sessionId?: number;
  createdAt?: string;
}

export function useChatWebSocket(sessionId: number | null, onMessage: (msg: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const token = useAuthStore.getState().token;
    const baseURL = import.meta.env.VITE_API_URL || '';

    const client = new Client({
      // Configure STOMP over SockJS
      webSocketFactory: () => new SockJS(`${baseURL}/ws-chat`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      // Subscribe to session topic
      client.subscribe(`/topic/chat/${sessionId}`, (message) => {
        if (message.body) {
          try {
            const parsed = JSON.parse(message.body);
            onMessageRef.current(parsed);
          } catch (e) {
            console.error('Failed to parse websocket message', e);
          }
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.onWebSocketClose = () => {
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId]);

  return { isConnected };
}
