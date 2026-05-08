import axiosClient from './axiosClient';

const appointmentApi = {
  bookAppointment: (data) => {
    return axiosClient.post('/api/v1/appointments', data);
  },
  
  getMyAppointments: (status) => {
    const params = status ? { status } : {};
    return axiosClient.get('/api/v1/appointments/my', { params });
  },
  
  getAppointmentDetail: (id) => {
    return axiosClient.get(`/api/v1/appointments/${id}`);
  },
  
  cancelAppointment: (id, data) => {
    return axiosClient.put(`/api/v1/appointments/${id}/cancel`, data);
  },
  
  getAvailableSlots: (doctorId, date) => {
    return axiosClient.get('/api/v1/appointments/slots', {
      params: { doctorId, date }
    });
  },
  
  createFromTicket: (data) => {
    return axiosClient.post('/api/v1/appointments/from-ticket', data)
  },

  getDoctorSchedules: (doctorId) => {
    return axiosClient.get(`/api/v1/schedules/doctor/${doctorId}`)
  }
};

export default appointmentApi;
