import api from './axiosInstance';

// Ultra-fast compression - skip heavy canvas operations
export const compressImage = (file) => {
  return Promise.resolve(file);
};

export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};
