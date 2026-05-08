import axiosClient from './axiosClient'

const triageTicketApi = {
  listPending: (params) => axiosClient.get('/api/v1/triage/tickets', { params }),
  getDetail: (ticketId) => axiosClient.get(`/api/v1/triage/tickets/${ticketId}`),
  getChatHistory: (ticketId) => axiosClient.get(`/api/v1/triage/tickets/${ticketId}/chat-history`),
  listMyTickets: (params) => axiosClient.get('/api/v1/triage/tickets/me', { params }),
  getMyTicketDetail: (ticketId) => axiosClient.get(`/api/v1/triage/tickets/me/${ticketId}`),
  getMyTicketChatHistory: (ticketId) => axiosClient.get(`/api/v1/triage/tickets/me/${ticketId}/chat-history`),
  assign: (payload) => axiosClient.post('/api/v1/triage/tickets/assign', payload),
  review: (payload) => axiosClient.post('/api/v1/triage/tickets/review', payload),
}

export default triageTicketApi
