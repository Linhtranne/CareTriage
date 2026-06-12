export const AGENT_COPY_KEYS = {
  trustDisclaimer: 'agentSession.trustDisclaimer',
  dataPrivacy: 'agentSession.dataPrivacy',
  generatedByAi: 'agentSession.generatedByAi',
  aiLabel: 'agentSession.aiLabel',
  urgency: {
    emergency: 'agentSession.urgency.emergency',
    urgent: 'agentSession.urgency.urgent',
    soon: 'agentSession.urgency.soon',
    routine: 'agentSession.urgency.routine',
  },
  confidence: {
    high: 'agentSession.confidence.high',
    medium: 'agentSession.confidence.medium',
    low: 'agentSession.confidence.low',
  },
  emergency: {
    lockMessage: 'agentSession.emergency.lockMessage',
    call115: 'agentSession.emergency.call115',
  },
} as const

export const AGENT_FALLBACK_COPY = {
  trustDisclaimer: 'AI triage is guidance, not a final diagnosis.',
  dataPrivacy: 'Your answers stay within the care workflow.',
  generatedByAi: 'AI assisted',
  aiLabel: 'AI',
  emergency: {
    lockMessage: 'Emergency symptoms detected. Please seek urgent medical help now.',
    call115: 'Call 115',
  },
} as const

export const AGENT_FALLBACK_COPY_VI = {
  trustDisclaimer: 'AI chỉ hỗ trợ phân loại ban đầu, không thay thế chẩn đoán của bác sĩ.',
  dataPrivacy: 'Câu trả lời của bạn chỉ được dùng trong quy trình chăm sóc.',
  generatedByAi: 'AI hỗ trợ',
  aiLabel: 'AI',
  emergency: {
    lockMessage: 'Phát hiện dấu hiệu cấp cứu. Vui lòng tìm hỗ trợ y tế ngay.',
    call115: 'Gọi 115',
  },
} as const
