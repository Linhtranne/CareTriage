import axiosClient from './axiosClient'

const contactApi = {
  submit: (data) => {
    return axiosClient.post('/api/v1/public/contact', data)
  }
}

export default contactApi
