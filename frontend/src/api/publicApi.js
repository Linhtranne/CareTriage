import axiosClient from './axiosClient'

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
  }
}

export default publicApi
