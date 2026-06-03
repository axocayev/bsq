import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Select, Button, Drawer, Spin } from 'antd';
import {
  UserOutlined, BankOutlined, FileTextOutlined,
  BookOutlined, LogoutOutlined, QuestionCircleOutlined, GlobalOutlined, MenuOutlined, DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ProfileDrawer from './ProfileDrawer';
import api from '../api/axiosInstance';

const { Header, Sider, Content } = Layout;

const LANGUAGES = [
  { value: 'en', label: '🇬🇧 EN' },
  { value: 'az', label: '🇦🇿 AZ' },
  { value: 'ru', label: '🇷🇺 RU' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [schoolName, setSchoolName] = useState(null);

  useEffect(() => {
    const fetchSchool = async () => {
      if (['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'].includes(user?.role)) {
        try {
          // Try to get school from user object first
          if (user?.schoolName) {
            setSchoolName(user.schoolName);
            return;
          }

          // Otherwise fetch based on role
          if (user?.schoolId) {
            const { data } = await api.get(`/admin/schools/${user.schoolId}`);
            setSchoolName(data.name);
          } else if (user?.role === 'SCHOOL_ADMIN') {
            // Get current school for school admin
            const { data } = await api.get('/school-admin/exams', { params: { size: 1 } });
            if (data.content?.length > 0 && data.content[0].schoolName) {
              setSchoolName(data.content[0].schoolName);
            }
          }
        } catch (e) {
          console.error('Failed to fetch school:', e);
        }
      }
    };
    fetchSchool();
  }, [user?.schoolId, user?.schoolName, user?.role]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('bsq_lang', lang);
  };

  const menuByRole = {
    ADMIN: [
      { key: '/admin/dashboard', icon: <DashboardOutlined />,     label: t('nav.dashboard') },
      { key: '/admin/schools',   icon: <BankOutlined />,          label: t('nav.schools') },
      { key: '/admin/users',     icon: <UserOutlined />,          label: t('nav.users') },
      { key: '/admin/exams',     icon: <FileTextOutlined />,      label: t('nav.exams') },
      { key: '/admin/subjects',  icon: <BookOutlined />,          label: t('nav.subjects') },
    ],
    SCHOOL_ADMIN: [
      { key: '/school-admin/dashboard', icon: <DashboardOutlined />,     label: t('nav.dashboard') },
      { key: '/school-admin/users', icon: <UserOutlined />,     label: t('nav.users') },
      { key: '/school-admin/exams', icon: <FileTextOutlined />, label: t('nav.exams') },
    ],
    TEACHER: [
      { key: '/teacher/dashboard', icon: <DashboardOutlined />,     label: t('nav.dashboard') },
      { key: '/teacher/questions', icon: <QuestionCircleOutlined />, label: t('nav.questions') },
      { key: '/teacher/exams',     icon: <FileTextOutlined />,       label: t('nav.exams') },
    ],
    STUDENT: [
      { key: '/student/dashboard', icon: <BookOutlined />,      label: t('nav.dashboard') },
      { key: '/student/exams',     icon: <FileTextOutlined />,  label: t('nav.myExams') },
    ],
  };

  const items = menuByRole[user?.role] || [];

  const handleNav = (key) => { navigate(key); setMobileOpen(false); };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: t('nav.profile') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: t('nav.logout'), danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') { logout(); navigate('/', { replace: true }); }
      if (key === 'profile') setProfileOpen(true);
    },
  };

  const sideMenu = (
    <>
      <div style={{ color: '#fff', textAlign: 'center', padding: '16px 8px', fontWeight: 700, fontSize: 18 }}>
        BSQ Portal
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => handleNav(key)}
      />
    </>
  );

  const roleName = user?.role ? t(`roles.${user.role}`, user.role) : '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop sider */}
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0" onBreakpoint={(broken) => { if (!broken) setMobileOpen(false); }}>
        {sideMenu}
      </Sider>

      {/* Mobile drawer */}
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={220}
        styles={{ body: { padding: 0, background: '#001529' }, header: { display: 'none' } }}
      >
        {sideMenu}
      </Drawer>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Button type="text" icon={<MenuOutlined />} onClick={() => setMobileOpen(true)} className="mobile-menu-btn" style={{ display: 'none' }} />

          {/* School name - shown for school admin, teacher, student */}
          {schoolName && ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'].includes(user?.role) && (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1677ff', whiteSpace: 'nowrap' }}>
              {schoolName}
            </div>
          )}

          <div style={{ flex: 1 }} />

          <Space size={8}>
            <GlobalOutlined style={{ color: '#888' }} />
            <Select value={i18n.language} onChange={changeLanguage} options={LANGUAGES} style={{ width: 80 }} variant="borderless" size="small" />
          </Space>

          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Avatar size={34} icon={<UserOutlined />} style={{ background: '#1677ff', flexShrink: 0 }} />
              <div style={{ lineHeight: 1.3, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#222', whiteSpace: 'nowrap' }}>
                  {user?.fullName || user?.username}
                </div>
                <div style={{ fontSize: 11, color: '#1677ff', fontWeight: 500 }}>{roleName}</div>
              </div>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Profile drawer */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />

      <style>{`
        @media (max-width: 991px) { .mobile-menu-btn { display: inline-flex !important; } }
      `}</style>
    </Layout>
  );
}
