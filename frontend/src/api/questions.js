import api from './axiosInstance';

export const getMyQuestions = (params) => api.get('/teacher/questions', { params });
export const getQuestion = (id) => api.get(`/teacher/questions/${id}`);
export const createQuestion = (data) => api.post('/teacher/questions', data);
export const updateQuestion = (id, data) => api.put(`/teacher/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/teacher/questions/${id}`);

export const importQuestionsFromAI = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/teacher/questions/import-ai', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        const pct = Math.round((e.loaded * 100) / e.total);
        onProgress(pct);
      }
    },
  });
};
