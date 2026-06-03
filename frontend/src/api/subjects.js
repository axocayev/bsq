import api from './axiosInstance';

// All roles — read only
export const getMySubjects = () => api.get('/teacher/subjects');
export const getSchoolSubjects = () => api.get('/school-admin/subjects');

// Admin — full CRUD
export const getAllSubjects = () => api.get('/admin/subjects');
export const createAdminSubject = (data) => api.post('/admin/subjects', data);
export const updateAdminSubject = (id, data) => api.put(`/admin/subjects/${id}`, data);
export const deleteAdminSubject = (id) => api.delete(`/admin/subjects/${id}`);
