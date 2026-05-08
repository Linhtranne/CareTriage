import axiosClient from './axiosClient';

const chatApi = {
  /**
   * Lấy hoặc tạo phiên chat active cho người dùng hiện tại.
   * Backend trả về null nếu không có session active -> tạo mới.
   */
  getOrCreateSession: async () => {
    const res = await axiosClient.get('/api/v1/chat/sessions/active');
    // Backend returns 200 with null body if no active session exists
    if (res.data && res.data.id) {
      return res.data;
    }
    // No active session, create a new one
    const createRes = await axiosClient.post('/api/v1/chat/sessions', null, {
      params: { type: 'TRIAGE', title: 'Tư vấn sức khỏe' }
    });
    return createRes.data;
  },

  /**
   * Lấy lịch sử tin nhắn
   */
  getHistory: (sessionId, page = 0, size = 20) => {
    return axiosClient.get(`/api/v1/chat/sessions/${sessionId}/history`, {
      params: { page, size }
    });
  }
};

export default chatApi;
