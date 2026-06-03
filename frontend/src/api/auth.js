import api from './axiosInstance';

export const login = (data) => api.post('/auth/login', data);
