import axiosClient from './axiosClient'

const ADMIN_BASE_URL = '/api/v1/admin/users';

export const adminApi = {
  getUsers: (params = {}) => {
    return axiosClient.get(ADMIN_BASE_URL, { params })
  },

  getUserById: (id) => {
    return axiosClient.get(`${ADMIN_BASE_URL}/${id}`)
  },

  changeRole: (id, roleName) => {
    return axiosClient.patch(`${ADMIN_BASE_URL}/${id}/role`, { roleName })
  },

  toggleActive: (id) => {
    return axiosClient.patch(`${ADMIN_BASE_URL}/${id}/status`)
  },

  updateProfile: (id, data) => {
    return axiosClient.patch(`${ADMIN_BASE_URL}/${id}/profile`, data)
  },

  getDashboardStats: () => {
    return axiosClient.get('/api/v1/admin/dashboard/stats')
  },

  // Department Management
  getDepartments: (params = {}) => {
    return axiosClient.get('/api/v1/departments', { params })
  },

  getDepartmentById: (id) => {
    return axiosClient.get(`/api/v1/departments/${id}`)
  },

  createDepartment: (data) => {
    return axiosClient.post('/api/v1/departments', data)
  },

  updateDepartment: (id, data) => {
    return axiosClient.put(`/api/v1/departments/${id}`, data)
  },

  deleteDepartment: (id) => {
    return axiosClient.delete(`/api/v1/departments/${id}`)
  },
}

export default adminApi
