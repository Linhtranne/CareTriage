import axiosClient from './axiosClient';

const DEFAULT_SESSION_TITLE = 'Tư vấn sức khỏe';

const chatApi = {
  createSession: async ({ type = 'TRIAGE', title = DEFAULT_SESSION_TITLE } = {}) => {
    const res = await axiosClient.post('/api/v1/chat/sessions', null, {
      params: { type, title }
    });
    return res.data;
  },

  getSessions: async (query = '') => {
    const res = await axiosClient.get('/api/v1/chat/sessions', {
      params: query ? { query } : undefined
    });
    return res.data || [];
  },

  uploadAttachment: async (sessionId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosClient.post(`/api/v1/chat/sessions/${sessionId}/attachments`, formData);
    return res.data;
  },

  /**
   * Lấy hoặc tạo phiên chat active cho người dùng hiện tại.
   * Backend trả về null nếu không có session active -> tạo mới.
   */
  getOrCreateSession: async () => {
    const res = await axiosClient.get('/api/v1/chat/sessions/active');
    if (res.data && res.data.id) {
      return res.data;
    }
    return chatApi.createSession();
  },


  /**
   * Kiểm tra trạng thái hoạt động của AI Service
   */
  checkAiHealth: async () => {
    try {
      const res = await axiosClient.get('/api/v1/chat/health/ai');
      return res.data?.status === 'UP';
    } catch {
      return false;
    }
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
