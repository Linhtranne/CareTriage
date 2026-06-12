import { useState, useEffect, useCallback } from 'react';
import triageTicketApi from '../../../services/triage-ticket-service';
import type { DoctorTriageTicket } from '../types/triage-review';
import { useTranslation } from 'react-i18next';

export function useDoctorTriageReview() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<DoctorTriageTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true);
    setError(null);
    try {
      const data = await triageTicketApi.listPending({ status: 'PENDING' });
      setTickets(data);
      if (data.length > 0) {
        setSelectedTicketId(prevId => prevId || data[0].id);
      } else {
        setSelectedTicketId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('doctorWorkbench.errorFallback'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTickets(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicketId) return;

    let isActive = true;

    async function fetchSelectedTicketDetail() {
      setIsDetailLoading(true);
      try {
        const [detail, conversationHistory] = await Promise.all([
          triageTicketApi.getDetail(selectedTicketId),
          triageTicketApi.getChatHistory(selectedTicketId)
        ]);

        if (!isActive) return;

        setTickets((currentTickets) => currentTickets.map((ticket) => (
          ticket.id === selectedTicketId
            ? {
                ...ticket,
                ...detail,
                conversationHistory: conversationHistory.length > 0
                  ? conversationHistory
                  : detail.conversationHistory
              }
            : ticket
        )));
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : t('doctorWorkbench.errorFallback'));
        }
      } finally {
        if (isActive) setIsDetailLoading(false);
      }
    }

    void fetchSelectedTicketDetail();

    return () => {
      isActive = false;
    };
  }, [selectedTicketId, t]);

  const selectTicket = useCallback((id: string) => {
    setSelectedTicketId(id);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitAction = useCallback(async (action: string, payload?: Record<string, unknown>) => {
    if (!selectedTicketId) return;
    setIsSubmitting(true);
    try {
      await triageTicketApi.doctorReview(selectedTicketId, { action, ...payload });
      await fetchTickets(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTicketId, fetchTickets]);

  const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId) || null;

  return {
    tickets,
    selectedTicketId,
    selectedTicket,
    isLoading,
    isDetailLoading,
    isSubmitting,
    error,
    refreshQueue: () => fetchTickets(true),
    selectTicket,
    submitAction
  };
}
