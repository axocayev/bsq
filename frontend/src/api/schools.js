import api from './axiosInstance';

export const getSchools = (params) => api.get('/admin/schools', { params });
export const createSchool = (data) => api.post('/admin/schools', data);
export const updateSchool = (id, data) => api.put(`/admin/schools/${id}`, data);
export const deleteSchool = (id) => api.delete(`/admin/schools/${id}`);
