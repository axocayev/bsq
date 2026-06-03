import api from './axiosInstance';

// Teacher
export const getMyExams = (params) => api.get('/teacher/exams', { params });
export const getExamById = (id) => api.get(`/teacher/exams/${id}`);
export const createExam = (data) => api.post('/teacher/exams', data);
export const updateExam = (id, data) => api.put(`/teacher/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/teacher/exams/${id}`);
export const submitExamForApproval = (id) => api.post(`/teacher/exams/${id}/submit`);
export const publishExam = (id) => api.post(`/teacher/exams/${id}/publish`);
export const closeExam = (id) => api.post(`/teacher/exams/${id}/close`);
export const getExamQuestions = (id) => api.get(`/teacher/exams/${id}/questions`);
export const addQuestionsToExam = (id, data) => api.post(`/teacher/exams/${id}/questions`, data);
export const removeQuestionFromExam = (examId, questionId) => api.delete(`/teacher/exams/${examId}/questions/${questionId}`);
export const updateQuestionPoints = (examId, questionId, data) => api.put(`/teacher/exams/${examId}/questions/${questionId}/points`, data);
export const assignStudents = (id, data) => api.post(`/teacher/exams/${id}/assign`, data);
export const getExamAssignments = (id) => api.get(`/teacher/exams/${id}/assignments`);
export const getAssignmentAnswers = (assignmentId) => api.get(`/teacher/assignments/${assignmentId}/answers`);
export const gradeAnswer = (answerId, data) => api.post(`/teacher/answers/${answerId}/grade`, data);

// Student
export const getMyAssignments = (params) => api.get('/student/exams', { params });
export const startExam = (examId, otpCode) => api.post(`/student/exams/${examId}/start`, { otpCode });
export const saveAnswer = (examId, data) => api.put(`/student/exams/${examId}/answer`, data);
export const submitExam = (examId, data) => api.post(`/student/exams/${examId}/submit`, data);
export const getExamResult = (examId) => api.get(`/student/exams/${examId}/result`);

// Admin / School admin
export const getAllExams = (params) => api.get('/admin/exams', { params });
export const adminUpdateExam = (id, data) => api.put(`/admin/exams/${id}`, data);
export const adminApproveExam = (id) => api.post(`/admin/exams/${id}/approve`);
export const adminRejectExam = (id, data) => api.post(`/admin/exams/${id}/reject`, data);
export const getSchoolExams = (params) => api.get('/school-admin/exams', { params });
export const schoolAdminUpdateExam = (id, data) => api.put(`/school-admin/exams/${id}`, data);
export const schoolAdminChangeStartTime = (id, data) => api.put(`/school-admin/exams/${id}/start-time`, data);
export const schoolAdminApproveExam = (id) => api.post(`/school-admin/exams/${id}/approve`);
export const schoolAdminRejectExam = (id, data) => api.post(`/school-admin/exams/${id}/reject`, data);
export const getSchoolExamAssignments = (id) => api.get(`/school-admin/exams/${id}/assignments`);
export const removeAssignment = (id) => api.delete(`/school-admin/assignments/${id}`);
export const getSchoolAdminAssignmentResult = (id) => api.get(`/school-admin/assignments/${id}/result`);
