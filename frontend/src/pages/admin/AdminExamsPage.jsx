import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Input, Button, Modal, Form, InputNumber, Space, message, DatePicker } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getAllExams, adminUpdateExam, adminApproveExam, adminRejectExam } from '../../api/exams';

const { Title, Text } = Typography;
const statusColor = { DRAFT: 'default', PENDING_APPROVAL: 'processing', APPROVED: 'cyan', REJECTED: 'error', PUBLISHED: 'green', CLOSED: 'red', ARCHIVED: 'gray' };

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const load = () => {
    setLoading(true);
    getAllExams({ size: 100 }).then(({ data }) => setExams(data.content)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = exams.filter((e) =>
    [e.title, e.schoolName, e.createdByName, e.status].some((f) =>
      String(f || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const openEdit = (exam) => {
    setEditModal(exam);
    form.setFieldsValue({
      title: exam.title, description: exam.description,
      durationMin: exam.durationMin,
      startDate: exam.startDate ? dayjs(exam.startDate) : null,
    });
  };

  const onEdit = async () => {
    const values = await form.validateFields();
    const payload = { ...values, startDate: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss') : null };
    try {
      await adminUpdateExam(editModal.id, payload);
      message.success(t('common.updated'));
      setEditModal(null);
      load();
    } catch { message.error(t('common.failed')); }
  };

  const onApprove = async (exam) => {
    try {
      await adminApproveExam(exam.id);
      message.success(t('exams.approved'));
      load();
    } catch { message.error(t('common.failed')); }
  };

  const onReject = async () => {
    try {
      await adminRejectExam(rejectModal.id, { reason: rejectReason });
      message.success(t('exams.rejected'));
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch { message.error(t('common.failed')); }
  };

  const columns = [
    { title: t('exams.examTitle'), dataIndex: 'title' },
    { title: t('users.school'), dataIndex: 'schoolName' },
    { title: 'Teacher', dataIndex: 'createdByName' },
    { title: t('exams.duration'), dataIndex: 'durationMin', render: (v) => `${v} min` },
    { title: t('exams.startDate'), dataIndex: 'startDate', render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—' },
    { title: t('exams.questionCount'), dataIndex: 'questionCount' },
    {
      title: t('common.status'), dataIndex: 'status', render: (v, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={statusColor[v]}>{t(`examStatus.${v}`, v)}</Tag>
          {v === 'REJECTED' && r.approvalNote && <Text style={{ fontSize: 11, color: '#ff4d4f' }}>↳ {r.approvalNote}</Text>}
        </Space>
      ),
    },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space wrap>
          {r.status === 'PENDING_APPROVAL' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => onApprove(r)}>{t('exams.approve')}</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => { setRejectModal(r); setRejectReason(''); }}>{t('exams.reject')}</Button>
            </>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>{t('common.edit')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 16 }}>{t('nav.exams')}</Title>
      <Input.Search placeholder={t('common.search')} allowClear onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

      <Modal title={t('exams.editExam')} open={!!editModal} onOk={onEdit} onCancel={() => setEditModal(null)}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('exams.examTitle')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t('exams.description')}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="durationMin" label={t('exams.durationMin')} rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="startDate" label={t('exams.startDate')}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={t('exams.rejectExam')} open={!!rejectModal} onOk={onReject} onCancel={() => setRejectModal(null)} okButtonProps={{ danger: true }} okText={t('exams.reject')}>
        <Input.TextArea rows={3} placeholder={t('exams.rejectReasonPlaceholder')} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </>
  );
}
