import { useState, useEffect, useCallback } from 'react';
import triageTicketApi from '../../../services/triage-ticket-service';
import type { DoctorTriageTicket } from '../../doctor-review/types/triage-review';
import { useTranslation } from 'react-i18next';

export function useDoctorWorkbench() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<DoctorTriageTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true);
    setError(null);
    try {
      const data = await triageTicketApi.listPending();
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

  const selectTicket = useCallback((id: string) => {
    setSelectedTicketId(id);
  }, []);

  const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId) || null;

  return {
    tickets,
    selectedTicketId,
    selectedTicket,
    isLoading,
    error,
    refreshQueue: () => fetchTickets(true),
    selectTicket
  };
}
