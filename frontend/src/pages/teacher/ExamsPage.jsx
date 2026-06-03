import { useEffect, useState, useRef } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, message,
  Tag, Typography, List, Badge, Divider, Alert, DatePicker, Tooltip,
} from 'antd';
import { PlusOutlined, SettingOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getMyExams, createExam, updateExam, deleteExam,
  submitExamForApproval, closeExam,
} from '../../api/exams';
import { typeColor, typeLabel } from '../../utils/questionTypes';

const { Title, Text } = Typography;

const statusColor = { DRAFT: 'default', PENDING_APPROVAL: 'processing', APPROVED: 'cyan', REJECTED: 'error', PUBLISHED: 'green', CLOSED: 'red', ARCHIVED: 'gray' };
const attemptColor = {
  NOT_STARTED: 'default', IN_PROGRESS: 'processing', SUBMITTED: 'warning',
  FULLY_GRADED: 'success', TIMED_OUT: 'error',
};

export default function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null); // holds the exam being edited
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { t } = useTranslation();

  const filtered = exams.filter((e) =>
    [e.title, e.status].some((f) => String(f || '').toLowerCase().includes(search.toLowerCase()))
  );

  const load = () => {
    setLoading(true);
    getMyExams({ size: 100 }).then(({ data }) => setExams(data.content)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const canEditExam = (exam) =>
    ['DRAFT', 'REJECTED'].includes(exam.status) || (exam.startDate && dayjs().isBefore(dayjs(exam.startDate)));

  const openEdit = (exam) => {
    setEditModal(exam);
    editForm.setFieldsValue({
      title: exam.title,
      description: exam.description,
      durationMin: exam.durationMin,
      startDate: exam.startDate ? dayjs(exam.startDate) : null,
    });
  };

  const onEdit = async () => {
    const values = await editForm.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss') : null,
    };
    try {
      await updateExam(editModal.id, payload);
      message.success(t('common.updated'));
      setEditModal(null);
      load();
    } catch { message.error(t('common.failed')); }
  };

  const openManage = (exam) => {
    navigate(`/teacher/exams/${exam.id}/manage`);
  };

  const openResults = (exam) => {
    navigate(`/teacher/exams/${exam.id}/results`);
  };

  const onCreate = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss') : null,
    };
    try {
      await createExam(payload);
      message.success(t('exams.examCreated'));
      setCreateModal(false);
      load();
    } catch { message.error(t('common.failed')); }
  };


  const columns = [
    { title: t('exams.examTitle'), dataIndex: 'title' },
    { title: t('exams.duration'), dataIndex: 'durationMin', render: (v) => `${v} min` },
    { title: t('exams.startDate'), dataIndex: 'startDate', render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—' },
    { title: t('exams.questionCount'), dataIndex: 'questionCount' },
    {
      title: t('common.status'), dataIndex: 'status', render: (v, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={statusColor[v]}>{t(`examStatus.${v}`, v)}</Tag>
          {v === 'REJECTED' && r.approvalNote && (
            <span style={{ fontSize: 11, color: '#ff4d4f' }}>↳ {r.approvalNote}</span>
          )}
        </Space>
      ),
    },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space wrap>
          {(r.status === 'DRAFT' || r.status === 'REJECTED') && (
            <Button size="small" type="primary"
              onClick={() => submitExamForApproval(r.id).then(() => { message.success(t('exams.submittedForApproval')); load(); }).catch((e) => message.error(e.response?.data?.message || t('common.failed')))}>
              {t('exams.submitForApproval')}
            </Button>
          )}
          {r.status === 'PUBLISHED' && (
            <Button size="small" danger
              onClick={() => closeExam(r.id).then(() => { message.success(t('exams.closed')); load(); })}>
              {t('common.close')}
            </Button>
          )}
          {canEditExam(r) && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>{t('common.edit')}</Button>
          )}
          {['DRAFT', 'REJECTED'].includes(r.status) && (
            <Button size="small" icon={<SettingOutlined />} onClick={() => openManage(r)}>{t('common.manage')}</Button>
          )}
          {['PUBLISHED', 'CLOSED'].includes(r.status) && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => openResults(r)}>{t('common.results')}</Button>
          )}
          {(r.status === 'DRAFT' || r.status === 'REJECTED') && (
            <Popconfirm title={t('exams.deleteConfirm')} onConfirm={() => deleteExam(r.id).then(() => { message.success(t('common.deleted')); load(); })}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('exams.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateModal(true); }}>
          {t('exams.createExam')}
        </Button>
      </div>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

      {/* Create exam modal */}
      <Modal title={t('exams.createExam')} open={createModal} onOk={onCreate} onCancel={() => setCreateModal(false)}>
        <Form form={form} layout="vertical" initialValues={{ durationMin: 60 }}>
          <Form.Item name="title" label={t('exams.examTitle')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t('exams.description')}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="durationMin" label={t('exams.durationMin')} rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startDate" label={t('exams.startDate')} rules={[{ required: true, message: t('exams.startDateRequired') }]}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit exam modal */}
      <Modal
        title={t('exams.editExam')}
        open={!!editModal}
        onOk={onEdit}
        onCancel={() => setEditModal(null)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label={t('exams.examTitle')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t('exams.description')}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="durationMin" label={t('exams.durationMin')} rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startDate" label={t('exams.startDate')} rules={[{ required: true, message: t('exams.startDateRequired') }]}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>


    </>
  );
}
