import axiosClient from './axiosClient'

const landingApi = {
  getContent: (lang = 'vi') => {
    return axiosClient.get(`/api/v1/public/landing-content?lang=${lang}`)
  },
  updateContent: (data, lang = 'vi') => {
    return axiosClient.put(`/api/v1/admin/landing-content?lang=${lang}`, data)
  }
}

export default landingApi
