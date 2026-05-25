import axiosClient from './http-client'

const landingApi = {
  getContent: (lang = 'vi') => {
    return axiosClient.get(`/api/v1/public/landing-content?lang=${lang}`)
  }
}

export default landingApi
