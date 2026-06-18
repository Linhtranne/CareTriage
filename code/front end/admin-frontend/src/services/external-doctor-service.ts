import axiosClient from './http-client';

const BASE_URL = '/api/v1/external-doctors';

export const externalDoctorApi = {
  getSources: () => {
    return axiosClient.get(`${BASE_URL}/sources`);
  },

  getAllDoctors: () => {
    return axiosClient.get(BASE_URL);
  },

  createSource: (data: any) => {
    return axiosClient.post(`${BASE_URL}/sources`, data);
  },

  triggerSync: (sourceId: number) => {
    return axiosClient.post(`${BASE_URL}/sync/${sourceId}`);
  },

  approveDoctor: (id: number) => {
    return axiosClient.post(`${BASE_URL}/${id}/approve`);
  },

  deleteDoctor: (id: number) => {
    return axiosClient.delete(`${BASE_URL}/${id}`);
  },

  deleteAllDoctors: () => {
    return axiosClient.delete(BASE_URL);
  },

  deleteAll: () => {
    return axiosClient.delete('/external-doctors')
  },
  bulkApprove: (doctorIds: number[]) => {
    return axiosClient.post('/external-doctors/bulk-approve', doctorIds)
  },
  approveAll: () => {
    return axiosClient.post('/external-doctors/approve-all')
  }
};


export default externalDoctorApi;
