import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import chatApi from '../../../services/chat-service';
import useAuthStore from '../../../store/auth-store';
import { TRIAGE_FALLBACK_COPY, TRIAGE_FALLBACK_COPY_VI } from '../constants/triage-copy';
import type { 
    ChatMessage, 
    TriageOrbState, 
    TriageProgressState,
    TriageUrgencyLevel
} from '../types/triage-session';
import { useChatWebSocket } from './use-chat-websocket';

const SESSION_HISTORY_LIMIT = 50;
const TRIAGE_URGENCY_LEVELS: readonly TriageUrgencyLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'EMERGENCY',
];

function toTriageUrgencyLevel(value: unknown): TriageUrgencyLevel {
  return TRIAGE_URGENCY_LEVELS.includes(value as TriageUrgencyLevel)
    ? (value as TriageUrgencyLevel)
    : 'LOW';
}

export function useTriageSession() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const copy = i18n.language?.startsWith('vi') ? TRIAGE_FALLBACK_COPY_VI : TRIAGE_FALLBACK_COPY;
  
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: 'Chào bạn, tôi là Trợ lý AI CareTriage. Vui lòng mô tả triệu chứng bạn đang gặp phải.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTurnId, setLastTurnId] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  
  const [orbState, setOrbState] = useState<TriageOrbState>('collecting');
  const [progressState, setProgressState] = useState<TriageProgressState>({
    intakeComplete: false,
    redFlagDetected: false,
    urgencyLevel: 'LOW',
    missingInformation: []
  });

  const inferIntakeCompleteFromReply = useCallback((content?: string) => {
    if (!content) return false;

    const normalized = content.toLowerCase();
    const hasReferral =
      normalized.includes('nên sớm đến gặp bác sĩ') ||
      normalized.includes('nên đến gặp bác sĩ') ||
      normalized.includes('nên gặp bác sĩ') ||
      normalized.includes('cần được bác sĩ') ||
      normalized.includes('cần được thăm khám') ||
      normalized.includes('chuyên khoa') ||
      normalized.includes('được kiểm tra trực tiếp');
    const hasClosing =
      normalized.includes('chúc bạn sớm khỏe') ||
      normalized.includes('điều trị phù hợp') ||
      normalized.includes('chẩn đoán chính xác');

    return hasReferral && hasClosing;
  }, []);

  const markIntakeComplete = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      intakeComplete: true,
      missingInformation: [],
    }));
    setOrbState('ready');
  }, []);

  const updateProgressFromMetadata = useCallback((metadataStr?: string, content?: string) => {
    const inferredComplete = inferIntakeCompleteFromReply(content);
    if (!metadataStr) {
      if (inferredComplete) markIntakeComplete();
      return;
    }

    try {
      const metadata = JSON.parse(metadataStr);
      
      let intakeComplete = inferredComplete;
      let redFlagDetected = false;
      let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' = 'LOW';
      let missingInfo: string[] = [];

      if (metadata.intake_complete !== undefined) intakeComplete = Boolean(metadata.intake_complete) || inferredComplete;

      if (metadata.red_flag_detected) redFlagDetected = true;
      if (metadata.missing_information) missingInfo = metadata.missing_information;

      if (metadata.triage_result) {
        if (metadata.triage_result.urgency_level) urgencyLevel = metadata.triage_result.urgency_level;
        if (metadata.triage_result.red_flag_detected) redFlagDetected = true;
        if (metadata.triage_result.missing_information) missingInfo = metadata.triage_result.missing_information;
      }

      setProgressState({
        intakeComplete,
        redFlagDetected,
        urgencyLevel,
        missingInformation: missingInfo,
        suggestedDepartment: metadata.triage_result?.suggested_department_name,
        departmentCode: metadata.triage_result?.suggested_department_code,
      });

      if (redFlagDetected || urgencyLevel === 'EMERGENCY') {
        setOrbState('emergency');
      } else if (intakeComplete) {
        setOrbState('ready');
      } else {
        setOrbState('collecting');
      }
    } catch (e) {
      console.error('Failed to parse message metadata', e);
      if (inferredComplete) markIntakeComplete();
    }
  }, [inferIntakeCompleteFromReply, markIntakeComplete]);

  // Eager session initialization has been disabled for Lazy ChatSession.
  useEffect(() => {
    // Keep this empty hook as placeholder for cleanup or logic that does not auto-create sessions
  }, []);

  useChatWebSocket(sessionId, useCallback((msg) => {
    if (msg.senderType === 'SYSTEM') {
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, { role: 'assistant', content: msg.content || '', id: msg.id }];
      });
    }
  }, []));

  const sendMessage = useCallback(async (content: string, retryTurnId?: string) => {
    if (!content.trim()) return;

    setError(null);
    setIsLoading(true);
    setOrbState('analyzing');
    
    const turnId = retryTurnId || crypto.randomUUID();
    setLastTurnId(turnId);

    if (!retryTurnId) {
      setMessages(prev => {
        // Filter out initial local greeting to keep UI clean, or append directly if it is user turn.
        const filtered = prev.filter(m => m.turnId || m.role !== 'assistant');
        return [...filtered, { role: 'user', content, turnId }];
      });
    }

    try {
      let assistantContent = '';
      let activeSessionId = sessionId;
      const tokens: { [seq: number]: string } = {};

      await chatApi.streamMessage(sessionId, content, turnId, (event) => {
        if (event.event === 'session') {
          const newSessionId = event.session_id || event.sessionId;
          if (newSessionId) {
            activeSessionId = newSessionId;
            setSessionId(newSessionId);
          }
        }

        if (event.event === 'token' && event.content && event.sequence) {
          tokens[event.sequence] = event.content;
          const sortedSeqs = Object.keys(tokens).map(Number).sort((a, b) => a - b);
          assistantContent = sortedSeqs.map(seq => tokens[seq]).join('');
          
          setMessages(prev => {
            if (!prev.some(m => m.turnId === turnId)) {
              return [...prev, { role: 'assistant', content: assistantContent, turnId }];
            }
            return prev.map(m => m.turnId === turnId ? { ...m, content: assistantContent } : m);
          });
        }

        if (event.event === 'final') {
          assistantContent = event.reply || assistantContent;
          setMessages(prev => {
            if (!prev.some(m => m.turnId === turnId)) {
              return [...prev, { role: 'assistant', content: assistantContent, turnId }];
            }
            return prev.map(m => m.turnId === turnId ? { ...m, content: assistantContent } : m);
          });

          const isEmergency = event.red_flag_detected;
          const intakeComplete = event.intake_complete;

          setProgressState(prev => ({
            ...prev,
            intakeComplete,
            redFlagDetected: isEmergency || false,
            urgencyLevel: toTriageUrgencyLevel(
              event.triage_result?.urgency_level
            ),
            missingInformation: event.missing_information || []
          }));

          if (isEmergency) {
            setOrbState('emergency');
          } else if (intakeComplete) {
            setOrbState('ready');
          } else {
            setOrbState('collecting');
          }
        }

        if (event.event === 'persisted') {
          setTicketStatus(event.ticket_status || null);
          
          if (event.ticket_status === 'READY') {
            navigate('/patient/appointments/book-appointment', {
              state: {
                fromTriage: true,
                ticketNumber: event.ticket_id || `TRIAGE-${activeSessionId}`,
                departmentName: event.specialty_name || progressState.suggestedDepartment || 'Nội tổng quát',
                reason: assistantContent
              }
            });
          } else if (event.ticket_status === 'NOT_NEEDED') {
            setOrbState('collecting');
          }
        }

        if (event.event === 'error') {
          setError(event.message || t('agentTriage.errorFallback', copy.errorFallback));
          setOrbState('collecting');
        }
      });

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agentTriage.errorFallback', copy.errorFallback));
      setOrbState('collecting');
      setIsLoading(false);
    }
  }, [copy.errorFallback, sessionId, t, navigate, progressState.suggestedDepartment]);

  const retryLastMessage = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lastTurnId) {
      setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.turnId === lastTurnId)));
      void sendMessage(lastUserMsg.content, lastTurnId);
    }
  }, [messages, sendMessage, lastTurnId]);

  const retryTicket = useCallback(async () => {
    if (!sessionId || !lastTurnId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      const baseURL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseURL}/api/v1/chat/sessions/${sessionId}/turns/${lastTurnId}/retry-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Retry ticket failed');
      }

      const event = await response.json();
      setTicketStatus(event.ticket_status || null);
      
      if (event.ticket_status === 'READY') {
        const assistantMsg = messages.find(m => m.turnId === lastTurnId && m.role === 'assistant');
        navigate('/patient/appointments/book-appointment', {
          state: {
            fromTriage: true,
            ticketNumber: event.ticket_id || `TRIAGE-${sessionId}`,
            departmentName: event.specialty_name || progressState.suggestedDepartment || 'Nội tổng quát',
            reason: assistantMsg ? assistantMsg.content : ''
          }
        });
      } else {
        setProgressState(prev => ({
          ...prev,
          redFlagDetected: event.red_flag_detected || false
        }));
        if (event.ticket_status === 'FAILED_PERMANENT') {
          setError('Khởi tạo lịch hẹn thất bại vĩnh viễn. Vui lòng liên hệ bộ phận hỗ trợ khách hàng.');
        } else {
          setError('Khởi tạo lịch hẹn thất bại. Bạn có thể nhấn thử lại.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối tạo lịch hẹn.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, lastTurnId, messages, navigate, progressState.suggestedDepartment]);

  const loadTicketHistory = useCallback(async (ticketId: string) => {
    if (!ticketId) return;

    setError(null);
    setTicketStatus(null);
    setLastTurnId(null);
    setOrbState('collecting');
    setProgressState({
      intakeComplete: false,
      redFlagDetected: false,
      urgencyLevel: 'LOW',
      missingInformation: []
    });
    setIsLoading(true);

    try {
      const parsedId = parseInt(ticketId, 10);
      const history = await chatApi.getHistory(parsedId, 0, SESSION_HISTORY_LIMIT);
      const mappedMessages: ChatMessage[] = history.map(msg => ({
        role: msg.senderType === 'USER' ? 'user' : 'assistant',
        content: msg.content,
        turnId: msg.turnId
      }));

      setSessionId(parsedId);
      setMessages(mappedMessages);
      
      const lastAiMsg = [...history].reverse().find(m => m.senderType === 'AI');
      if (lastAiMsg) {
        if (lastAiMsg.turnId) setLastTurnId(lastAiMsg.turnId);
        if (lastAiMsg.metadata) {
          updateProgressFromMetadata(lastAiMsg.metadata, lastAiMsg.content);
        } else if (inferIntakeCompleteFromReply(lastAiMsg.content)) {
          markIntakeComplete();
        } else {
          setOrbState('collecting');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agentTriage.errorFallback', copy.errorFallback));
    } finally {
      setIsLoading(false);
    }
  }, [copy.errorFallback, inferIntakeCompleteFromReply, markIntakeComplete, t, updateProgressFromMetadata]);

  const createNewSession = useCallback(() => {
    setError(null);
    setTicketStatus(null);
    setLastTurnId(null);
    setSessionId(null);
    setOrbState('collecting');
    setProgressState({
      intakeComplete: false,
      redFlagDetected: false,
      urgencyLevel: 'LOW',
      missingInformation: []
    });
    setMessages([
      {
        role: 'assistant',
        content: 'Chào bạn, tôi là Trợ lý AI CareTriage. Vui lòng mô tả triệu chứng bạn đang gặp phải.'
      }
    ]);
  }, []);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    orbState,
    progressState,
    sendMessage,
    retryLastMessage,
    loadTicketHistory,
    createNewSession,
    ticketStatus,
    retryTicket
  };
}
