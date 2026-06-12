import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Sparkles, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { DoctorTriageTicket } from '../../doctor-review/types/triage-review'

type AIEvidencePanelProps = Readonly<{
  ticket: DoctorTriageTicket | null;
}>

export default function AIEvidencePanel({ ticket }: Readonly<AIEvidencePanelProps>) {
  const { t } = useTranslation()

  if (!ticket) {
    return (
      <Box className="h-full flex items-center justify-center p-6 rounded-2xl backdrop-blur-[var(--glass-blur-desktop)] bg-[var(--agent-surface)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)]">
        <Typography variant="body2" className="italic text-[var(--color-surface-500)]">
          {t('doctorReview.noSelectedCase')}
        </Typography>
      </Box>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Box className="h-full relative overflow-hidden flex flex-col gap-4 p-6 rounded-2xl backdrop-blur-[var(--glass-blur-desktop)] bg-[var(--agent-surface)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)]">
        {/* Ambient AI Glow */}
        <Box className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-600)]/10 rounded-full blur-3xl pointer-events-none -z-10" />
        
        <Box className="flex items-center gap-2 text-[var(--color-primary-600)] mb-2">
          <Sparkles size={20} />
          <Typography variant="h6" className="font-semibold text-[var(--color-surface-900)]">
            {t('doctorWorkbench.evidencePanel')}
          </Typography>
        </Box>

        <Box className="flex flex-col gap-6 flex-grow overflow-y-auto">
          {/* Reasoning */}
          <Box>
            <Typography variant="subtitle2" className="text-[var(--color-surface-500)] uppercase tracking-wider mb-2">
              {t('doctorWorkbench.evidence.reasoning')}
            </Typography>
            <Typography variant="body2" className="text-[var(--color-surface-800)] leading-relaxed italic">
              {ticket.clinicalReasoningSummary || t('doctorReview.missingSummary')}
            </Typography>
          </Box>

          {/* AI Summary (if different from reasoning) */}
          <Box>
            <Typography variant="subtitle2" className="text-[var(--color-surface-500)] uppercase tracking-wider mb-2">
              {t('doctorWorkbench.evidence.summary')}
            </Typography>
            <Typography variant="body2" className="text-[var(--color-surface-800)] leading-relaxed">
              {ticket.aiSummary || ticket.symptomSummary || t('doctorReview.missingSummary')}
            </Typography>
          </Box>

          {/* Conditions */}
          {ticket.possibleConditions && ticket.possibleConditions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" className="text-[var(--color-surface-500)] uppercase tracking-wider mb-2">
                {t('doctorWorkbench.evidence.conditions')}
              </Typography>
              <ul className="list-disc list-inside text-sm text-[var(--color-surface-800)]">
                {ticket.possibleConditions.map((cond, idx) => (
                  <li key={cond}>{cond}</li>
                ))}
              </ul>
            </Box>
          )}

          {/* Confidence */}
          <Box className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] mt-auto">
            <CheckCircle size={20} />
            <Typography variant="body2" className="font-semibold">
              {t('doctorWorkbench.evidence.confidence')}
            </Typography>
          </Box>

        </Box>
      </Box>
    </motion.div>
  )
}
