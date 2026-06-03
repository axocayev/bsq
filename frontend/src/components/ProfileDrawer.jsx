import { useEffect, useState } from 'react';
import { Drawer, Tabs, Form, Input, Button, message, Avatar, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../api/me';
import { useAuth } from '../context/AuthContext';

const { Text, Title } = Typography;

export default function ProfileDrawer({ open, onClose }) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [infoForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (open) {
      getMyProfile().then(({ data }) => {
        setProfile(data);
        infoForm.setFieldsValue({ fullName: data.fullName, email: data.email, phone: data.phone || '' });
      });
    }
  }, [open]);

  const onSaveInfo = async () => {
    const values = await infoForm.validateFields();
    setSavingInfo(true);
    try {
      const { data } = await updateMyProfile(values);
      setProfile(data);
      updateUser({ fullName: data.fullName, email: data.email });
      message.success(t('profile.saved'));
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
    finally { setSavingInfo(false); }
  };

  const onChangePassword = async () => {
    const values = await pwForm.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      return message.error(t('profile.passwordMismatch'));
    }
    setSavingPw(true);
    try {
      await changeMyPassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      message.success(t('profile.passwordChanged'));
      pwForm.resetFields();
    } catch (e) {
      const code = e.response?.data?.code;
      message.error(code === 'WRONG_PASSWORD' ? t('profile.wrongPassword') : t('common.failed'));
    }
    finally { setSavingPw(false); }
  };

  const items = [
    {
      key: 'info',
      label: <Space><UserOutlined />{t('profile.personalInfo')}</Space>,
      children: (
        <Form form={infoForm} layout="vertical">
          <Form.Item name="fullName" label={t('profile.fullName')}>
            <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} />
          </Form.Item>
          <Form.Item name="email" label={t('profile.email')} rules={[{ type: 'email', message: 'Invalid email' }]}>
            <Input prefix={<MailOutlined style={{ color: '#bbb' }} />} />
          </Form.Item>
          <Form.Item name="phone" label={t('profile.phone')}>
            <Input prefix={<PhoneOutlined style={{ color: '#bbb' }} />} />
          </Form.Item>
          <Button type="primary" block loading={savingInfo} onClick={onSaveInfo}>
            {t('common.save')}
          </Button>
        </Form>
      ),
    },
    {
      key: 'password',
      label: <Space><LockOutlined />{t('profile.changePassword')}</Space>,
      children: (
        <Form form={pwForm} layout="vertical">
          <Form.Item name="currentPassword" label={t('profile.currentPassword')} rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label={t('profile.newPassword')} rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label={t('profile.confirmPassword')} rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" block loading={savingPw} onClick={onChangePassword}>
            {t('profile.changePassword')}
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <Drawer
      title={t('profile.title')}
      open={open}
      onClose={onClose}
      width={380}
    >
      {profile && (
        <>
          <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
            <Avatar size={72} icon={<UserOutlined />} style={{ background: '#1677ff', marginBottom: 12 }} />
            <Title level={5} style={{ margin: '0 0 4px' }}>{profile.fullName || profile.username}</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>{profile.username}</Text>
            <div style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, background: '#f0f5ff', color: '#1677ff', borderRadius: 12, padding: '2px 12px' }}>
                {t(`roles.${profile.role}`, profile.role)}
              </Text>
            </div>
          </div>
          <Divider style={{ margin: '0 0 16px' }} />
        </>
      )}
      <Tabs items={items} />
    </Drawer>
  );
}
