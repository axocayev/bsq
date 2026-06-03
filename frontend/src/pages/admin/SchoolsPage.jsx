import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getSchools, createSchool, updateSchool, deleteSchool } from '../../api/schools';

const { Title } = Typography;

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const filtered = schools.filter((s) =>
    [s.name, s.code].some((f) => String(f || '').toLowerCase().includes(search.toLowerCase()))
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSchools({ size: 100 });
      setSchools(data.content);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const onSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) await updateSchool(editing.id, values);
      else await createSchool(values);
      message.success(editing ? t('common.updated') : t('common.created'));
      setModalOpen(false);
      load();
    } catch { message.error(t('common.operationFailed')); }
  };

  const onDelete = async (id) => {
    try { await deleteSchool(id); message.success(t('common.deleted')); load(); }
    catch { message.error(t('common.deleteFailed')); }
  };

  const columns = [
    { title: t('common.name'), dataIndex: 'name' },
    { title: t('schools.code'), dataIndex: 'code' },
    { title: t('common.status'), dataIndex: 'active', render: (v) => v ? t('common.active') : t('common.inactive') },
    { title: t('common.created'), dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleDateString() },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>{t('common.edit')}</Button>
          <Popconfirm title={t('schools.deleteConfirm')} onConfirm={() => onDelete(r.id)}>
            <Button size="small" danger>{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>{t('schools.title')}</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>{t('schools.addSchool')}</Button></Col>
      </Row>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />
      <Modal
        title={editing ? t('schools.editSchool') : t('schools.addSchool')}
        open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label={t('schools.code')}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
