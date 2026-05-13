import axiosClient from './axiosClient';

const notificationApi = {
  getUnreadCount: async () => {
    const res = await axiosClient.get('/api/v1/notifications/unread-count');
    return res.data;
  },

  getRecent: async (limit = 10) => {
    const res = await axiosClient.get('/api/v1/notifications/recent', {
      params: { limit }
    });
    return res.data;
  },

  markAsRead: async (id) => {
    const res = await axiosClient.put(`/api/v1/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await axiosClient.put('/api/v1/notifications/read-all');
    return res.data;
  }
};

export default notificationApi;
