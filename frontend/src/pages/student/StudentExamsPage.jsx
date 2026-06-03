import { useEffect, useState } from 'react';
import { Table, Button, Tag, Typography, Space, Input, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyAssignments } from '../../api/exams';

const { Title } = Typography;
const statusColor = {
  NOT_STARTED: 'default', IN_PROGRESS: 'processing',
  SUBMITTED: 'warning', FULLY_GRADED: 'success', TIMED_OUT: 'error',
};

export default function StudentExamsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [otpModal, setOtpModal] = useState(null); // holds the assignment
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const filtered = assignments.filter((a) =>
    [a.examTitle, a.status].some((f) => String(f || '').toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    setLoading(true);
    getMyAssignments({ size: 100 }).then(({ data }) => setAssignments(data.content)).finally(() => setLoading(false));
  }, []);

  const openOtpModal = (assignment) => {
    setOtpModal(assignment);
    setOtpValue('');
  };

  const onConfirmOtp = async () => {
    if (otpValue.length !== 6) return message.warning(t('otp.enterSixDigits'));
    setOtpLoading(true);
    try {
      // startExam with OTP — if wrong, backend throws INVALID_OTP
      const { startExam } = await import('../../api/exams');
      await startExam(otpModal.examId, otpValue);
      setOtpModal(null);
      navigate(`/student/exams/${otpModal.examId}/take`);
    } catch (e) {
      message.error(e.response?.data?.message === 'Invalid OTP code'
        ? t('otp.invalidOtp')
        : e.response?.data?.message || t('common.failed'));
    } finally { setOtpLoading(false); }
  };

  const columns = [
    { title: t('studentExams.exam'), dataIndex: 'examTitle' },
    { title: t('studentExams.duration'), dataIndex: 'durationMin', render: (v) => `${v} min` },
    { title: t('common.status'), dataIndex: 'status', render: (v) => <Tag color={statusColor[v]}>{t(`attemptStatus.${v}`, v)}</Tag> },
    {
      title: t('studentExams.score'), render: (_, r) =>
        r.finalScore != null ? `${r.finalScore}` :
          r.autoScore != null ? `${r.autoScore} (${t('studentExams.partial')})` : '—'
    },
    { title: t('studentExams.deadline'), dataIndex: 'deadline', render: (v) => v ? new Date(v).toLocaleString() : '—' },
    {
      title: t('studentExams.action'), render: (_, r) => (
        <Space>
          {r.status === 'NOT_STARTED' && (
            <Button type="primary" size="small" onClick={() => openOtpModal(r)}>
              {t('studentExams.startExam')}
            </Button>
          )}
          {r.status === 'IN_PROGRESS' && (
            <Button type="primary" size="small" onClick={() => navigate(`/student/exams/${r.examId}/take`)}>
              {t('studentExams.continue')}
            </Button>
          )}
          {['SUBMITTED', 'FULLY_GRADED', 'TIMED_OUT'].includes(r.status) && (
            <Button size="small" onClick={() => navigate(`/student/exams/${r.examId}/result`)}>
              {t('studentExams.viewResult')}
            </Button>
          )}
        </Space>
      )
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 16 }}>{t('studentExams.title')}</Title>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={t('otp.enterOtp')}
        open={!!otpModal}
        onOk={onConfirmOtp}
        onCancel={() => setOtpModal(null)}
        okText={t('otp.startExam')}
        confirmLoading={otpLoading}
        okButtonProps={{ disabled: otpValue.length !== 6 }}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ marginBottom: 12, color: '#555' }}>{t('otp.enterOtpHint')}</div>
          <Input
            maxLength={6}
            size="large"
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{ width: 180, textAlign: 'center', fontSize: 24, fontFamily: 'monospace', letterSpacing: 6 }}
            autoFocus
            onPressEnter={onConfirmOtp}
          />
        </div>
      </Modal>
    </>
  );
}
