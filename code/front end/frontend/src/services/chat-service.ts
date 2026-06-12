import axiosClient from './http-client';
import type { ChatSessionDTO, ChatMessageDTO, ChatAttachmentDTO } from '../features/triage/types/chat-session-types';
import useAuthStore from '../store/auth-store';

const DEFAULT_SESSION_TITLE = 'Tư vấn sức khỏe';

export interface ChatStreamEvent {
  event: string;
  content?: string;
  reply?: string;
  message?: string;
  metadata?: string;
  id?: number;
  sequence?: number;
  turn_id?: string;
  ticket_status?: string;
  ticket_id?: string;
  specialty_code?: string;
  specialty_name?: string;
  red_flag_detected?: boolean;
  intake_complete?: boolean;
  triage_result?: {
    urgency_level?: string;
    suggested_department_name?: string;
    suggested_department_code?: string;
  };
  missing_information?: string[];
  session_id?: number;
  sessionId?: number;
  classification_status?: string;
  classification_error_code?: string;
  ai_message_id?: number;
  replayed?: boolean;
  retryable?: boolean;
  code?: string;
}

const parseSseEvent = (rawEvent: string): ChatStreamEvent | null => {
  const lines = rawEvent.split(/\r?\n/);
  let event = 'message';
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  });

  if (dataLines.length === 0) return null;

  try {
    return { event, ...JSON.parse(dataLines.join('\n')) };
  } catch {
    return { event, content: dataLines.join('\n') };
  }
};

const chatApi = {
  createSession: async ({ type = 'TRIAGE', title = DEFAULT_SESSION_TITLE } = {}): Promise<ChatSessionDTO> => {
    const res = await axiosClient.post('/api/v1/chat/sessions', null, {
      params: { type, title }
    });
    return res.data;
  },

  getSessions: async (query = ''): Promise<ChatSessionDTO[]> => {
    const res = await axiosClient.get('/api/v1/chat/sessions', {
      params: query ? { query } : undefined
    });
    return res.data || [];
  },

  uploadAttachment: async (sessionId: number, file: File): Promise<ChatAttachmentDTO> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosClient.post(`/api/v1/chat/sessions/${sessionId}/attachments`, formData);
    return res.data;
  },

  getActiveSession: async (): Promise<ChatSessionDTO | null> => {
    const res = await axiosClient.get('/api/v1/chat/sessions/active');
    return res.data?.id ? res.data : null;
  },

  updateSessionTitle: async (sessionId: number, title: string): Promise<ChatSessionDTO> => {
    const res = await axiosClient.patch(`/api/v1/chat/sessions/${sessionId}/title`, { title });
    return res.data;
  },

  getOrCreateSession: async (): Promise<ChatSessionDTO> => {
    const res = await axiosClient.get('/api/v1/chat/sessions/active');
    if (res.data?.id) {
      return res.data;
    }
    return chatApi.createSession();
  },



  streamMessage: async (
    sessionId: number | null,
    content: string,
    turnId: string,
    onEvent: (event: ChatStreamEvent) => void
  ): Promise<void> => {
    const token = useAuthStore.getState().token;
    const baseURL = import.meta.env.VITE_API_URL || '';
    const url = sessionId === null
      ? `${baseURL}/api/v1/chat/messages/stream`
      : `${baseURL}/api/v1/chat/sessions/${sessionId}/messages/stream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content,
        senderType: 'USER',
        turnId,
        ...(sessionId === null ? { sessionType: 'TRIAGE', title: content.substring(0, 60) } : {})
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';

      events.forEach((rawEvent) => {
        const parsed = parseSseEvent(rawEvent);
        if (parsed) onEvent(parsed);
      });
    }

    if (buffer.trim()) {
      const parsed = parseSseEvent(buffer);
      if (parsed) onEvent(parsed);
    }
  },

  checkAiHealth: async (): Promise<boolean> => {
    try {
      const res = await axiosClient.get('/api/v1/chat/health/ai');
      return res.data?.status === 'UP';
    } catch {
      return false;
    }
  },

  getHistory: async (sessionId: number, _page = 0, _size = 50): Promise<ChatMessageDTO[]> => {
    const res = await axiosClient.get(`/api/v1/chat/sessions/${sessionId}/history`);
    // Spring Data JPA page return:
    if (Array.isArray(res.data?.content)) {
      return res.data.content;
    } else if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }
};

export default chatApi;
