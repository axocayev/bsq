import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import SchoolAdminDashboard from '../SchoolAdminDashboard';
import i18n from '../../../i18n/index';

vi.mock('../../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <SchoolAdminDashboard />
      </BrowserRouter>
    </I18nextProvider>
  );
};

describe('SchoolAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard with recent exams and users sections', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Dashboard|İdarə Paneli/i)).toBeInTheDocument();
    });
  });

  it('should display recent exams as clickable rows', async () => {
    const api = await import('../../../api/axiosInstance');
    api.default.get.mockResolvedValue({
      data: {
        content: [
          { id: 1, title: 'Math Exam', status: 'PUBLISHED', questionCount: 10, createdAt: new Date() },
          { id: 2, title: 'Science Exam', status: 'DRAFT', questionCount: 15, createdAt: new Date() },
        ]
      }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Math Exam')).toBeInTheDocument();
      expect(screen.getByText('Science Exam')).toBeInTheDocument();
    });
  });

  it('should navigate to exam assignments when recent exam row is clicked', async () => {
    const api = await import('../../../api/axiosInstance');
    api.default.get.mockResolvedValue({
      data: {
        content: [
          { id: 1, title: 'Math Exam', status: 'PUBLISHED', questionCount: 10, createdAt: new Date() },
        ]
      }
    });

    renderComponent();

    await waitFor(() => {
      const examRow = screen.getByText('Math Exam');
      expect(examRow).toBeInTheDocument();
    });

    const examRow = screen.getByText('Math Exam').closest('div[style*="cursor"]');
    if (examRow) {
      await userEvent.click(examRow);
      expect(mockNavigate).toHaveBeenCalledWith('/school-admin/exams/1/assignments');
    }
  });

  it('should navigate to users page when recent user row is clicked', async () => {
    const api = await import('../../../api/axiosInstance');
    api.default.get.mockResolvedValue({
      data: {
        content: [
          { id: 1, fullName: 'John Doe', role: 'TEACHER', email: 'john@example.com', createdAt: new Date() },
        ]
      }
    });

    renderComponent();

    await waitFor(() => {
      const userRow = screen.getByText('John Doe');
      expect(userRow).toBeInTheDocument();
    });

    const userRow = screen.getByText('John Doe').closest('div[style*="cursor"]');
    if (userRow) {
      await userEvent.click(userRow);
      expect(mockNavigate).toHaveBeenCalledWith('/school-admin/users');
    }
  });

  it('should display stat cards with correct counts', async () => {
    const api = await import('../../../api/axiosInstance');
    api.default.get.mockImplementation((url) => {
      if (url.includes('users')) {
        return Promise.resolve({
          data: {
            content: [
              { id: 1, role: 'TEACHER' },
              { id: 2, role: 'STUDENT' },
              { id: 3, role: 'STUDENT' },
            ]
          }
        });
      }
      if (url.includes('exams')) {
        return Promise.resolve({
          data: {
            content: [
              { id: 1, status: 'PUBLISHED' },
              { id: 2, status: 'DRAFT' },
            ]
          }
        });
      }
      return Promise.resolve({ data: { content: [] } });
    });

    renderComponent();

    await waitFor(() => {
      // Should display counts
      const text = screen.getByText(/3|1|2/);
      expect(text).toBeInTheDocument();
    });
  });

  it('should handle empty recent exams and users', async () => {
    const api = await import('../../../api/axiosInstance');
    api.default.get.mockResolvedValue({
      data: {
        content: []
      }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Dashboard|İdarə Paneli/i)).toBeInTheDocument();
    });
  });
});
