import api from './axiosInstance';

export const getUsers = (params) => api.get('/admin/users', { params });
export const createUser = (data) => api.post('/admin/users', data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const adminUpdateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const resetUserPassword = (id, data) => api.put(`/admin/users/${id}/password`, data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export const getSchoolUsers = (params) => api.get('/school-admin/users', { params });
export const getTeacherStudents = (params) => api.get('/teacher/students', { params });
export const createSchoolUser = (data) => api.post('/school-admin/users', data);
export const schoolAdminUpdateUser = (id, data) => api.put(`/school-admin/users/${id}`, data);
export const resetSchoolUserPassword = (id, data) => api.put(`/school-admin/users/${id}/password`, data);
export const deleteSchoolUser = (id) => api.delete(`/school-admin/users/${id}`);
