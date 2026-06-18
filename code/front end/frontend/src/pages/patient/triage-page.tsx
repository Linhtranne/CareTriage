import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Briefcase } from 'lucide-react'
import publicApi from '../../services/public-service'
import TriageStateOrb from '../../features/triage/components/triage-state-orb'
import AgentConversationPanel from '../../features/triage/components/agent-conversation-panel'
import TrustFooter from '../../components/base/trust-footer'
import EmergencyFlagBanner from '../../components/base/emergency-flag-banner'
import { LAYOUT } from '../../constants/layout-constants'

import { useTranslation } from 'react-i18next'
import { AGENT_COPY_KEYS, AGENT_FALLBACK_COPY, AGENT_FALLBACK_COPY_VI } from '../../features/agent-session/constants/agent-copy'
import { TRIAGE_COPY_KEYS, TRIAGE_FALLBACK_COPY, TRIAGE_FALLBACK_COPY_VI } from '../../features/triage/constants/triage-copy'
import { useTriageSession } from '../../features/triage/hooks/use-triage-session'

function MiniDoctorList({ department, urgencyLevel, reason, onSelectDoctor }: { department?: string, urgencyLevel?: string, reason: string, onSelectDoctor: (doc: any) => void }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!department) return
    let isMounted = true
    const fetchDocs = async () => {
      try {
        const res = await publicApi.getRecommendedDoctors({
          symptoms: reason,
          department: department,
          severity: urgencyLevel || 'LOW',
          triageTicketId: null
        })
        if (isMounted) setDocs(res.data?.recommendations?.slice(0, 3) || [])
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchDocs()
    return () => { isMounted = false }
  }, [department, urgencyLevel, reason])

  if (!department) return null
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <span className="animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 h-6 w-6"></span>
      </Box>
    )
  }
  if (docs.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {docs.map(doc => (
        <div
          key={doc.id}
          onClick={() => onSelectDoctor(doc)}
          style={{
            display: 'flex',
            padding: '12px 14px',
            background: 'var(--color-surface-50)',
            borderRadius: 12,
            border: '1px solid var(--color-surface-200)',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary-300)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-surface-200)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--color-primary-100)', overflow: 'hidden', flexShrink: 0 }}>
             <img src={doc.avatarUrl || 'https://i.pravatar.cc/150?u=' + doc.id} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--color-surface-900)' }}>{doc.fullName}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-surface-500)', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} /> {doc.rating || '4.9'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={12} /> {doc.experienceYears || 5} năm KN
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-surface-500)', fontSize: 12, marginTop: 4 }}>
              <MapPin size={12} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.clinicAddress || 'Phòng khám CareTriage'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
             <button style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
               Chọn
             </button>
          </div>
        </div>
      ))}
    </div>
  )
}

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
    isLoadingHistory,
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
              isLoadingHistory={isLoadingHistory}
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
              {/* Booking CTA — shown when AI has completed intake */}
              {orbState === 'ready' && progressState.intakeComplete && (
                <div
                  style={{
                    animation: 'bubbleIn 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
                    background: 'linear-gradient(135deg, var(--color-primary-50) 0%, oklch(97% 0.025 165) 100%)',
                    border: '1.5px solid var(--color-primary-200)',
                    borderRadius: 20,
                    boxShadow: '0 4px 24px oklch(65% 0.15 165 / 0.10)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginTop: 20,
                    maxWidth: 720,
                    padding: '20px 24px 22px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        alignItems: 'center',
                        background: 'var(--color-primary-100)',
                        borderRadius: 12,
                        color: 'var(--color-primary-700)',
                        display: 'flex',
                        flexShrink: 0,
                        height: 44,
                        justifyContent: 'center',
                        width: 44,
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                        <polyline points="9 16 11 18 15 14"/>
                      </svg>
                    </span>
                    <div>
                      <p style={{ color: 'var(--color-primary-800)', fontWeight: 850, fontSize: 14, margin: 0, lineHeight: 1.4 }}>
                        {progressState.suggestedDepartment
                          ? `Danh sách bác sĩ ${progressState.suggestedDepartment} được đề xuất`
                          : 'Danh sách bác sĩ được đề xuất'}
                      </p>
                      <p style={{ color: 'var(--color-primary-600)', fontSize: 13, margin: '3px 0 0', lineHeight: 1.5 }}>
                        Hệ thống đã chọn lọc các bác sĩ phù hợp nhất dựa trên triệu chứng của bạn.
                      </p>
                    </div>
                  </div>
                  
                  {/* Fetch and Render Mini Doctor List */}
                  <MiniDoctorList 
                    department={progressState.suggestedDepartment} 
                    urgencyLevel={progressState.urgencyLevel}
                    reason={messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || ''}
                    onSelectDoctor={(doc) => {
                       navigate('/patient/appointments/book-appointment', {
                         state: {
                           fromTriage: true,
                           departmentName: progressState.suggestedDepartment || 'Nội tổng quát',
                           reason: messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '',
                           prefillDoctorId: doc.isExternal ? null : doc.id,
                           prefillExternalDoctorId: doc.isExternal ? doc.id : null,
                           isExternal: doc.isExternal,
                           doctorName: doc.fullName
                         }
                       })
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/patient/appointments/book-appointment', {
                        state: {
                          fromTriage: true,
                          departmentName: progressState.suggestedDepartment || 'Nội tổng quát',
                          reason: messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || ''
                        }
                      })
                    }
                    style={{
                      alignItems: 'center',
                      background: 'var(--color-primary-600)',
                      border: 0,
                      borderRadius: 14,
                      color: 'var(--color-surface-50)',
                      cursor: 'pointer',
                      display: 'flex',
                      fontWeight: 850,
                      fontSize: 14,
                      gap: 8,
                      justifyContent: 'center',
                      minHeight: 48,
                      padding: '12px 24px',
                      transition: 'opacity 0.2s, transform 0.15s',
                      width: '100%',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                      <polyline points="9 16 11 18 15 14"/>
                    </svg>
                    Xem tất cả bác sĩ và Đặt lịch hẹn
                  </button>
                </div>
              )}
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
