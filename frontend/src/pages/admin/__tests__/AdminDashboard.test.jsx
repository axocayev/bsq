import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import AdminDashboard from '../AdminDashboard';
import i18n from '../../../i18n/index';
import * as usersApi from '../../../api/users';
import * as examsApi from '../../../api/exams';
import * as subjectsApi from '../../../api/subjects';
import * as schoolsApi from '../../../api/schools';

vi.mock('../../../api/users');
vi.mock('../../../api/exams');
vi.mock('../../../api/subjects');
vi.mock('../../../api/schools');

const renderComponent = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    </I18nextProvider>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title', async () => {
    usersApi.getUsers.mockResolvedValue({
      data: { totalElements: 10, content: [] }
    });
    examsApi.getAllExams.mockResolvedValue({
      data: { totalElements: 5, content: [] }
    });
    subjectsApi.getAllSubjects.mockResolvedValue({
      data: []
    });
    schoolsApi.getSchools.mockResolvedValue({
      data: { totalElements: 3, content: [] }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Dashboard|İdarə Paneli/i)).toBeInTheDocument();
    });
  });

  it('should display stat cards', async () => {
    usersApi.getUsers.mockResolvedValue({
      data: { totalElements: 10, content: [
        { id: 1, role: 'STUDENT' },
        { id: 2, role: 'TEACHER' },
      ] }
    });
    examsApi.getAllExams.mockResolvedValue({
      data: { totalElements: 5, content: [] }
    });
    subjectsApi.getAllSubjects.mockResolvedValue({
      data: []
    });
    schoolsApi.getSchools.mockResolvedValue({
      data: { totalElements: 3, content: [] }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // totalUsers
      expect(screen.getByText('5')).toBeInTheDocument();  // totalExams
      expect(screen.getByText('3')).toBeInTheDocument();  // totalSchools
    });
  });

  it('should fetch and display exam status data', async () => {
    usersApi.getUsers.mockResolvedValue({
      data: { totalElements: 10, content: [] }
    });
    examsApi.getAllExams.mockResolvedValue({
      data: {
        totalElements: 5,
        content: [
          { id: 1, status: 'PUBLISHED' },
          { id: 2, status: 'DRAFT' },
          { id: 3, status: 'PUBLISHED' },
        ]
      }
    });
    subjectsApi.getAllSubjects.mockResolvedValue({
      data: []
    });
    schoolsApi.getSchools.mockResolvedValue({
      data: { totalElements: 3, content: [] }
    });

    renderComponent();

    await waitFor(() => {
      expect(examsApi.getAllExams).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    usersApi.getUsers.mockRejectedValue(new Error('API Error'));
    examsApi.getAllExams.mockRejectedValue(new Error('API Error'));
    subjectsApi.getAllSubjects.mockRejectedValue(new Error('API Error'));
    schoolsApi.getSchools.mockRejectedValue(new Error('API Error'));

    renderComponent();

    // Component should still render even with errors
    await waitFor(() => {
      expect(screen.queryByText(/Dashboard|İdarə Paneli/i)).toBeInTheDocument();
    });
  });

  it('should count students correctly', async () => {
    const users = [
      { id: 1, role: 'STUDENT', fullName: 'Student 1' },
      { id: 2, role: 'STUDENT', fullName: 'Student 2' },
      { id: 3, role: 'TEACHER', fullName: 'Teacher 1' },
      { id: 4, role: 'ADMIN', fullName: 'Admin 1' },
    ];

    usersApi.getUsers.mockResolvedValue({
      data: { totalElements: 4, content: users }
    });
    examsApi.getAllExams.mockResolvedValue({
      data: { totalElements: 0, content: [] }
    });
    subjectsApi.getAllSubjects.mockResolvedValue({
      data: []
    });
    schoolsApi.getSchools.mockResolvedValue({
      data: { totalElements: 0, content: [] }
    });

    renderComponent();

    await waitFor(() => {
      // Should display 2 students (filtered from users)
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
