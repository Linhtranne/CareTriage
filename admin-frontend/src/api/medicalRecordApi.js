import axiosClient from './axiosClient';

const medicalRecordApi = {
    getRecordById: (id) => {
        return axiosClient.get(`/medical-records/${id}`);
    },
    getPatientHistory: (patientId) => {
        return axiosClient.get(`/medical-records/patient/${patientId}`);
    },
    createRecord: (data) => {
        return axiosClient.post('/medical-records', data);
    }
};

export default medicalRecordApi;
