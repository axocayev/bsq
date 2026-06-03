import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table, Button, Badge, Typography, Space, Popconfirm, message, Spin, Card,
} from 'antd';
import { ArrowLeftOutlined, FilePdfOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSchoolExamAssignments, removeAssignment } from '../../api/exams';

const { Title, Text } = Typography;

const attemptColor = {
  NOT_STARTED: 'default', IN_PROGRESS: 'processing',
  SUBMITTED: 'warning', FULLY_GRADED: 'success', TIMED_OUT: 'error',
};

export default function ExamAssignmentsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examTitle, setExamTitle] = useState('');
  const [examStartDate, setExamStartDate] = useState(null);

  const load = () => {
    setLoading(true);
    getSchoolExamAssignments(examId)
      .then(({ data }) => {
        setAssignments(data);
        if (data.length > 0) {
          setExamTitle(data[0].examTitle);
          setExamStartDate(data[0].startDate);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [examId]);

  const onRemove = async (assignmentId) => {
    try {
      await removeAssignment(assignmentId);
      message.success(t('exams.studentRemoved'));
      load();
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${examTitle} — ${t('otp.otpList')}`, 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[t('users.fullName'), t('exams.examTitle'), t('exams.startDate'), t('otp.otpCode')]],
      body: assignments.map((a) => [
        a.studentName,
        a.examTitle,
        a.startDate ? dayjs(a.startDate).format('YYYY-MM-DD HH:mm') : '—',
        a.otpCode || '—',
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [22, 119, 255] },
    });
    doc.save(`otp-${examTitle?.replace(/\s+/g, '_')}.pdf`);
  };

  const columns = [
    { title: t('users.fullName'), dataIndex: 'studentName' },
    {
      title: t('common.status'), dataIndex: 'status',
      render: (v) => <Badge status={attemptColor[v]} text={t(`attemptStatus.${v}`, v)} />,
    },
    {
      title: t('otp.otpCode'), dataIndex: 'otpCode',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>
          {v || '—'}
        </span>
      ),
    },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space>
          {['SUBMITTED', 'FULLY_GRADED', 'TIMED_OUT'].includes(r.status) && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/school-admin/assignments/${r.id}/result`)}
            >
              {t('common.view')}
            </Button>
          )}
          {r.status === 'NOT_STARTED' && (
            <Popconfirm title={t('exams.removeStudentConfirm')} onConfirm={() => onRemove(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>{t('common.remove')}</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/school-admin/exams')}>
          {t('common.back')}
        </Button>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={2}>
          <Title level={4} style={{ margin: 0 }}>{examTitle}</Title>
          {examStartDate && (
            <Text type="secondary">
              {t('exams.startDate')}: {dayjs(examStartDate).format('YYYY-MM-DD HH:mm')}
            </Text>
          )}
        </Space>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong>{t('exams.students')} ({assignments.length})</Text>
        <Button icon={<FilePdfOutlined />} onClick={exportPdf} disabled={!assignments.length}>
          {t('otp.exportPdf')}
        </Button>
      </div>

      <Table
        dataSource={assignments}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: t('results.noStudents') }}
      />
    </>
  );
}
