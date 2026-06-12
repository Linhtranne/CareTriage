import { Box } from '@mui/material'
import { LAYOUT } from '../../constants/layout-constants'
import DoctorCommandHeader from '../../features/doctor-workbench/components/doctor-command-header'
import ActiveCaseStrip from '../../features/doctor-workbench/components/active-case-strip'
import ClinicalPriorityBoard from '../../features/doctor-workbench/components/clinical-priority-board'
import AIEvidencePanel from '../../features/doctor-workbench/components/ai-evidence-panel'
import HandoffActions from '../../features/doctor-workbench/components/handoff-actions'
import { useDoctorWorkbench } from '../../features/doctor-workbench/hooks/use-doctor-workbench'

export default function WorkbenchPage() {
  const {
    tickets,
    selectedTicketId,
    selectedTicket,
    isLoading,
    error,
    selectTicket
  } = useDoctorWorkbench()

  return (
    <Box className="min-h-screen bg-[var(--color-surface-100)] flex flex-col overflow-hidden">
      <DoctorCommandHeader />

      <Box 
        className="flex-grow flex gap-6 p-6 overflow-hidden mx-auto w-full"
        sx={{ maxWidth: LAYOUT.doctorWorkbench.boardMinWidth }}
      >
        {/* Left Column: Priority Board */}
        <Box 
          className="flex-shrink-0 flex flex-col h-full overflow-y-auto pr-2"
          sx={{ width: LAYOUT.doctorWorkbench.sidebarWidth }}
        >
          <ClinicalPriorityBoard 
            tickets={tickets}
            selectedTicketId={selectedTicketId}
            onSelect={selectTicket}
            isLoading={isLoading}
            error={error}
          />
        </Box>

        {/* Right Column: Active Case details & AI Panel */}
        <Box className="flex-grow flex flex-col gap-6 h-full overflow-y-auto">
          <ActiveCaseStrip ticket={selectedTicket} />
          
          <Box className="flex-grow">
            <AIEvidencePanel ticket={selectedTicket} />
          </Box>
          
          <Box className="flex-shrink-0">
            <HandoffActions />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
