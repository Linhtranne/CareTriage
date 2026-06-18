import axiosClient from './http-client'

export const appointmentApi = {
  getAllAppointmentsForAdmin: (params = {}) => {
    return axiosClient.get('/api/v1/appointments/admin', { params })
  },
  updateStatusByAdmin: (id: string | number, data: { status: string, notes?: string }) => {
    return axiosClient.put(`/api/v1/appointments/admin/${id}/status`, data)
  },
}

export default appointmentApi
