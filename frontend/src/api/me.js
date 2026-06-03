import api from './axiosInstance';

export const getMyProfile = () => api.get('/me');
export const updateMyProfile = (data) => api.put('/me', data);
export const changeMyPassword = (data) => api.put('/me/password', data);
