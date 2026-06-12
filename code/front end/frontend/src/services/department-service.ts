import axiosClient from './http-client';

export interface Department {
  id: number;
  code: string;
  name: string;
  description: string;
  image?: string;
  status: string;
}

const departmentService = {
  getAllDepartments: async (params?: { page?: number; size?: number; search?: string; sortBy?: string; direction?: string }): Promise<Department[]> => {
    const res = await axiosClient.get('/api/v1/departments', { params });
    const payload = res.data;
    
    if (typeof payload === 'object' && payload !== null) {
      if ('data' in payload) {
        const dataObj = (payload as { data: unknown }).data;
        if (typeof dataObj === 'object' && dataObj !== null && 'content' in dataObj) {
          const content = (dataObj as { content: unknown }).content;
          if (Array.isArray(content)) {
            return content as Department[];
          }
        }
      }
      if ('content' in payload) {
        const content = (payload as { content: unknown }).content;
        if (Array.isArray(content)) {
          return content as Department[];
        }
      }
    }
    return [];
  }
};

export default departmentService;
