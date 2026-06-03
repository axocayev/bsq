import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Space, Popconfirm,
  message, Tag, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getAllSubjects, createAdminSubject, updateAdminSubject, deleteAdminSubject } from '../../api/subjects';

const { Title } = Typography;

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const load = () => {
    setLoading(true);
    getAllSubjects().then(({ data }) => setSubjects(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingSubject(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (subject) => {
    setEditingSubject(subject);
    form.setFieldsValue({ name: subject.name });
    setModalOpen(true);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    try {
      if (editingSubject) {
        await updateAdminSubject(editingSubject.id, values);
        message.success(t('common.updated'));
      } else {
        await createAdminSubject(values);
        message.success(t('subjects.created'));
      }
      setModalOpen(false);
      load();
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
  };

  const onDelete = async (id) => {
    try {
      await deleteAdminSubject(id);
      message.success(t('common.deleted'));
      load();
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
  };

  const columns = [
    { title: t('subjects.name'), dataIndex: 'name' },
    {
      title: t('common.status'), render: (_, r) =>
        r.inUse
          ? <Tag color="orange">{t('questions.inUse')}</Tag>
          : <Tag color="default">{t('subjects.free')}</Tag>,
    },
    { title: t('common.created'), dataIndex: 'createdAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} disabled={r.inUse} onClick={() => openEdit(r)}>
            {t('common.edit')}
          </Button>
          <Popconfirm title={t('subjects.deleteConfirm')} disabled={r.inUse} onConfirm={() => onDelete(r.id)}>
            <Button size="small" danger disabled={r.inUse}>{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('subjects.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('subjects.addSubject')}
        </Button>
      </div>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingSubject ? t('subjects.editSubject') : t('subjects.addSubject')}
        open={modalOpen}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('subjects.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
