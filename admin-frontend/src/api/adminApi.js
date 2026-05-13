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
}

export default adminApi
