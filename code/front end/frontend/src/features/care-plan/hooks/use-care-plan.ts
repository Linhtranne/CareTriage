import { useState, useCallback, useEffect } from 'react'
import type { PatientCarePlan } from '../types/care-plan'
import triageTicketApi from '../../../services/triage-ticket-service'

export function useCarePlan() {
  const [carePlan, setCarePlan] = useState<PatientCarePlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCarePlan = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true)
    setError(null)
    
    try {
      const plan = await triageTicketApi.getLatestPatientCarePlan()
      setCarePlan(plan)
    } catch {
      setError('carePlan.errorFallback')
      setCarePlan(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCarePlan(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCarePlan])

  return {
    carePlan,
    isLoading,
    error,
    refresh: () => fetchCarePlan(true)
  }
}
