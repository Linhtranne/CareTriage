import axiosClient from './axiosClient';

const doctorApi = {
  getDoctorPatients: (params) => {
    return axiosClient.get('/api/v1/doctors/me/patients', { params });
  },
  
  getDoctorPatientDetail: (patientId) => {
    return axiosClient.get(`/api/v1/doctors/me/patients/${patientId}`);
  }
};

export default doctorApi;
