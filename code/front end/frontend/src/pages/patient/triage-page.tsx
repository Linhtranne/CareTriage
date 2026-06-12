import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TriageStateOrb from '../../features/triage/components/triage-state-orb'
import AgentConversationPanel from '../../features/triage/components/agent-conversation-panel'
import TrustFooter from '../../components/base/trust-footer'
import EmergencyFlagBanner from '../../components/base/emergency-flag-banner'
import { LAYOUT } from '../../constants/layout-constants'

import { useTranslation } from 'react-i18next'
import { AGENT_COPY_KEYS, AGENT_FALLBACK_COPY, AGENT_FALLBACK_COPY_VI } from '../../features/agent-session/constants/agent-copy'
import { TRIAGE_COPY_KEYS, TRIAGE_FALLBACK_COPY, TRIAGE_FALLBACK_COPY_VI } from '../../features/triage/constants/triage-copy'
import { useTriageSession } from '../../features/triage/hooks/use-triage-session'

/**
 * Phase 1 Patient Triage Route.
 * Full-page conversation experience replacing the floating widget.
 */
export default function TriagePage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { t, i18n } = useTranslation()
  const triageCopy = i18n.language?.startsWith('vi') ? TRIAGE_FALLBACK_COPY_VI : TRIAGE_FALLBACK_COPY
  const agentCopy = i18n.language?.startsWith('vi') ? AGENT_FALLBACK_COPY_VI : AGENT_FALLBACK_COPY
  
  const { 
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
  } = useTriageSession()

  const navigate = useNavigate()
  const isEmergency = orbState === 'emergency'

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: `calc(100vh - ${LAYOUT.triage.pageHeightOffset}px)`,
        height: `calc(100vh - ${LAYOUT.triage.pageHeightOffset}px)`,
        bgcolor: 'var(--color-surface-50)',
        overflow: 'hidden',
        background: 'var(--color-surface-50)'
      }}
    >
      {isEmergency && (
        <EmergencyFlagBanner>
          <span className="flex-1">{t(AGENT_COPY_KEYS.emergency.lockMessage, agentCopy.emergency.lockMessage)}</span>
          <button
            className="px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider"
            style={{
              background: 'var(--color-surface-50)',
              color: 'var(--urgency-emergency)',
            }}
          >
            {t(AGENT_COPY_KEYS.emergency.call115, agentCopy.emergency.call115)}
          </button>
        </EmergencyFlagBanner>
      )}

      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: 0,
          px: 0,
          py: 0,
        }}
      >
        
        {/* Main Conversation Area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: 'none',
            borderRadius: 0,
            bgcolor: 'var(--color-surface-50)',
            boxShadow: 'none',
          }}
        >
          
          {/* Mobile Triage State Bar */}
          {isMobile && (
            <Box 
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: '1px solid var(--color-surface-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'var(--color-surface-50)'
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-surface-900)', fontWeight: 800 }}>
                  {t(TRIAGE_COPY_KEYS.pageTitle, triageCopy.pageTitle)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--color-surface-600)' }}>
                  {t(TRIAGE_COPY_KEYS.orbState[orbState], triageCopy.orbState[orbState])}
                </Typography>
              </Box>
              <TriageStateOrb 
                state={orbState} 
                className="scale-75 origin-right" 
              />
            </Box>
          )}

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <AgentConversationPanel 
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSendMessage={sendMessage}
              onRetry={retryLastMessage}
              onSelectHistorySession={loadTicketHistory}
              onNewSession={createNewSession}
              orbState={orbState}
              progressState={progressState}
              isEmergency={isEmergency}
              sessionId={sessionId}
            >
              {ticketStatus === 'FAILED_RETRYABLE' && (
                <div
                  className="mt-5 text-sm"
                  style={{
                    animation: 'bubbleIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
                    background: 'var(--warning-soft)',
                    border: '1px solid var(--warning-border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                    color: 'var(--color-surface-800)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    lineHeight: 1.65,
                    maxWidth: 720,
                    padding: '16px 20px 18px',
                  }}
                >
                  <p className="font-semibold" style={{ margin: 0 }}>
                    {t('agentTriage.ticketFailedRetryable', 'Không thể khởi tạo lịch hẹn tự động do sự cố kết nối. Bạn có thể nhấn nút dưới đây để thử lại.')}
                  </p>
                  <button
                    type="button"
                    onClick={retryTicket}
                    disabled={isLoading}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'var(--color-primary-600)',
                      color: 'var(--color-white)',
                      border: 0,
                      borderRadius: 'var(--radius-button)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: 700,
                      minHeight: 36,
                      padding: '8px 16px',
                      transition: 'opacity 0.2s',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? 'Đang tạo lại...' : 'Thử lại tạo lịch hẹn'}
                  </button>
                </div>
              )}

              {ticketStatus === 'FAILED_PERMANENT' && (
                <div
                  className="mt-5 text-sm"
                  style={{
                    animation: 'bubbleIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
                    background: 'var(--danger-soft)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                    color: 'var(--color-surface-800)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    lineHeight: 1.65,
                    maxWidth: 720,
                    padding: '16px 20px 18px',
                  }}
                >
                  <p className="font-semibold" style={{ margin: 0, color: 'var(--color-danger)' }}>
                    {t('agentTriage.ticketFailedPermanentTitle', 'Khởi tạo lịch hẹn không thành công')}
                  </p>
                  <p style={{ margin: 0 }}>
                    {t('agentTriage.ticketFailedPermanentDesc', 'Hệ thống không thể xử lý yêu cầu đặt lịch tự động lúc này. Vui lòng liên hệ bộ phận hỗ trợ khách hàng qua hotline 1900 1234 hoặc đến quầy đón tiếp để được nhân viên y tế hỗ trợ trực tiếp.')}
                  </p>
                </div>
              )}
            </AgentConversationPanel>
          </Box>
        </Box>
      </Box>
      
      <TrustFooter />
    </Box>
  )
}
