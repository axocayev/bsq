import { Form, Input, Button, Card, Typography, message, Select, Space } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const LANGUAGES = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'az', label: '🇦🇿 Azərbaycan' },
  { value: 'ru', label: '🇷🇺 Русский' },
];

const roleHome = {
  ADMIN: '/admin/dashboard',
  SCHOOL_ADMIN: '/school-admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('bsq_lang', lang);
  };

  const onFinish = async ({ username, password }) => {
    try {
      const data = await login(username, password);
      navigate(roleHome[data.role] || '/');
    } catch {
      message.error(t('login.invalidCredentials'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          <Space>
            <GlobalOutlined style={{ color: '#888' }} />
            <Select
              value={i18n.language}
              onChange={changeLanguage}
              options={LANGUAGES}
              style={{ width: 150 }}
              variant="borderless"
              size="small"
            />
          </Space>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0 }}>{t('appName')}</Title>
          <p style={{ color: '#888', marginTop: 4 }}>{t('login.subtitle')}</p>
        </div>
        <Form form={form} onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: t('login.usernameRequired') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('login.username')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('login.passwordRequired') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('login.password')} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>{t('login.signIn')}</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
