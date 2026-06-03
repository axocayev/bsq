import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Tag, Typography, Row, Col, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getSchoolUsers, createSchoolUser, deleteSchoolUser, schoolAdminUpdateUser } from '../../api/users';

const { Title } = Typography;
const ROLES = ['TEACHER', 'STUDENT'];
const roleColor = { TEACHER: 'blue', STUDENT: 'green' };

export default function SchoolUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const filtered = users.filter((u) =>
    [u.username, u.fullName, u.email, u.role].some((f) =>
      String(f || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const load = () => {
    setLoading(true);
    getSchoolUsers({ size: 100 }).then(({ data }) => setUsers(data.content)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    const values = await createForm.validateFields();
    try {
      await createSchoolUser(values);
      message.success(t('users.userCreated'));
      setCreateOpen(false);
      load();
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
  };

  const openEdit = (user) => {
    setEditModal(user);
    editForm.setFieldsValue({ fullName: user.fullName, email: user.email, phone: user.phone || '', password: '' });
  };

  const onEdit = async () => {
    const values = await editForm.validateFields();
    const payload = { fullName: values.fullName, email: values.email, phone: values.phone };
    if (values.password) payload.password = values.password;
    try {
      await schoolAdminUpdateUser(editModal.id, payload);
      message.success(t('common.updated'));
      setEditModal(null);
      load();
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
  };

  const columns = [
    { title: t('users.username'), dataIndex: 'username' },
    { title: t('users.fullName'), dataIndex: 'fullName', render: (v) => v || '—' },
    { title: t('users.email'), dataIndex: 'email' },
    { title: t('users.phone'), dataIndex: 'phone', render: (v) => v || '—' },
    { title: t('users.role'), dataIndex: 'role', render: (v) => <Tag color={roleColor[v]}>{t(`roles.${v}`, v)}</Tag> },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>{t('common.edit')}</Button>
          <Popconfirm title={t('users.deactivateConfirm')} onConfirm={() => deleteSchoolUser(r.id).then(() => { message.success(t('common.deleted')); load(); })}>
            <Button size="small" danger>{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>{t('users.title')}</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
            {t('users.addUser')}
          </Button>
        </Col>
      </Row>
      <Input.Search placeholder={t('common.search')} allowClear onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

      {/* Create modal */}
      <Modal title={t('users.addUser')} open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="username" label={t('users.username')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label={t('users.email')} rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="fullName" label={t('users.fullName')}><Input /></Form.Item>
          <Form.Item name="phone" label={t('users.phone')}><Input /></Form.Item>
          <Form.Item name="password" label={t('users.password')} rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label={t('users.role')} rules={[{ required: true }]}>
            <Select options={ROLES.map((r) => ({ value: r, label: t(`roles.${r}`, r) }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit modal */}
      <Modal
        title={`${t('users.editUser')} — ${editModal?.username}`}
        open={!!editModal}
        onOk={onEdit}
        onCancel={() => setEditModal(null)}
        okText={t('common.save')}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="fullName" label={t('users.fullName')}><Input /></Form.Item>
          <Form.Item name="email" label={t('users.email')} rules={[{ type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label={t('users.phone')}><Input /></Form.Item>
          <Form.Item name="password" label={t('users.newPasswordOptional')}>
            <Input.Password placeholder="••••••" autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
