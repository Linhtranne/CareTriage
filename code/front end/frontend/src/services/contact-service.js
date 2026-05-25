import axiosClient from './http-client'

const contactApi = {
  submit: (data) => {
    return axiosClient.post('/api/v1/public/contact', data)
  }
}

export default contactApi
