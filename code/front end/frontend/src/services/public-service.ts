import axiosClient from './http-client'

const publicApi = {
  getDepartments: (params) => {
    return axiosClient.get('/api/v1/departments', { params })
  },
  
  getDoctors: (params) => {
    return axiosClient.get('/api/v1/doctors', { params })
  },
  
  getDoctorById: (id) => {
    return axiosClient.get(`/api/v1/doctors/${id}`)
  },

  getDepartmentById: (id) => {
    return axiosClient.get(`/api/v1/departments/${id}`)
  },

  getDoctorSlots: (id, date) => {
    return axiosClient.get(`/api/v1/doctors/${id}/slots`, { params: { date } })
  },

  getRecommendedDoctors: (criteria) => {
    return axiosClient.post('/api/v1/recommendations/doctors', criteria)
  },

  getExternalDoctors: () => {
    return axiosClient.get('/api/v1/external-doctors')
  }
}

export default publicApi
