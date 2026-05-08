import axiosClient from './axiosClient';

const medicalRecordApi = {
  getPatientHistory: (patientId) => {
    return axiosClient.get(`/api/v1/medical-records/patient/${patientId}`);
  },
  
  getRecordById: (id) => {
    return axiosClient.get(`/api/v1/medical-records/${id}`);
  },
  
  // EHR / Clinical Note APIs from Sprint 15
  getNotesByPatient: (patientId) => {
    return axiosClient.get(`/api/ehr/notes/${patientId}`);
  }
};

export default medicalRecordApi;
