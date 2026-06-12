import { Box, useTheme, useMediaQuery } from '@mui/material'
import PatientSessionQueue from '../../features/doctor-review/components/patient-session-queue'
import DoctorReviewWorkbench from '../../features/doctor-review/components/doctor-review-workbench'
import AiSummaryPanel from '../../features/doctor-review/components/ai-summary-panel'
import MissingInfoPanel from '../../features/doctor-review/components/missing-info-panel'
import EhrEntityStrip from '../../features/ehr/components/ehr-entity-strip'
import ClinicalTimeline from '../../features/doctor-review/components/clinical-timeline'
import AgentActionBar from '../../features/doctor-review/components/agent-action-bar'
import { LAYOUT } from '../../constants/layout-constants'
import { useDoctorTriageReview } from '../../features/doctor-review/hooks/use-doctor-triage-review'

/**
 * Phase 1 Doctor Review Route.
 * Review cockpit experience replacing the simple inbox.
 */
export default function ReviewPage() {
  const theme = useTheme()
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))
  const {
    tickets,
    selectedTicketId,
    selectedTicket,
    isLoading,
    isDetailLoading,
    error,
    refreshQueue,
    selectTicket,
    isSubmitting,
    submitAction
  } = useDoctorTriageReview()

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isTablet ? 'column' : 'row',
        height: 'calc(100vh - 64px)', // Adjust based on AppBar height
        bgcolor: 'var(--color-surface-50)',
        overflow: 'hidden'
      }}
    >
      {/* Queue */}
      <Box 
        component="aside"
        sx={{
          width: isTablet ? '100%' : LAYOUT.doctorReview.queueWidth,
          height: isTablet ? 'auto' : '100%',
          maxHeight: isTablet ? '180px' : 'none',
          flexShrink: 0,
          borderRight: isTablet ? 'none' : '1px solid var(--color-surface-200)',
          borderBottom: isTablet ? '1px solid var(--color-surface-200)' : 'none',
          bgcolor: 'var(--color-surface-50)',
          overflow: 'hidden' // PatientSessionQueue handles internal scroll
        }}
      >
        <PatientSessionQueue 
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelect={selectTicket}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshQueue}
        />
      </Box>

      {/* Main Review Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DoctorReviewWorkbench>
          <AiSummaryPanel ticket={selectedTicket} isLoading={isDetailLoading} />
          <MissingInfoPanel ticket={selectedTicket} />
          <EhrEntityStrip />
          <ClinicalTimeline ticket={selectedTicket} />
        </DoctorReviewWorkbench>
        
        <AgentActionBar 
          key={selectedTicket?.id || 'empty'}
          ticket={selectedTicket} 
          isSubmitting={isSubmitting} 
          onAction={submitAction} 
        />
      </Box>

    </Box>
  )
}
