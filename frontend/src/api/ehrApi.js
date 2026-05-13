import axiosClient from './axiosClient';

const ehrApi = {
  extractFromText: (payload) => {
    return axiosClient.post('/api/ehr/extract', payload);
  },

  extractFromFile: (formData) => {
    return axiosClient.post('/api/ehr/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60s for AI processing
    });
  },

  getNotesByPatient: (patientId) => {
    return axiosClient.get(`/api/ehr/notes/${patientId}`);
  },

  /**
   * Returns ExtractionResultDto: includes rawText, noteType, extractionStatus,
   * createdAt, AND all entity lists (entities, medications, symptoms, conditions, dosages, labTests, procedures).
   * Use this for both the result page and entity display — no separate note fetch needed.
   */
  getEntitiesByNote: (noteId) => {
    return axiosClient.get(`/api/ehr/entities/${noteId}`);
  },

  getPatientSummary: (patientId) => {
    return axiosClient.get(`/api/ehr/summary/${patientId}`);
  },

  searchPatients: (params) => {
    return axiosClient.get('/api/ehr/search', { params });
  },

  getStatistics: () => {
    return axiosClient.get('/api/ehr/stats');
  },
};

export default ehrApi;
