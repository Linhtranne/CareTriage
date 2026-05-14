import axiosClient from './axiosClient';

const medicalRecordApi = {
  createRecord: (data) => {
    return axiosClient.post('/api/v1/medical-records', data);
  },
  getPatientHistory: (patientId) => {
    return axiosClient.get(`/api/v1/medical-records/patient/${patientId}`);
  },
  
  getRecordById: (id) => {
    return axiosClient.get(`/api/v1/medical-records/${id}`);
  },
  
};

export default medicalRecordApi;
