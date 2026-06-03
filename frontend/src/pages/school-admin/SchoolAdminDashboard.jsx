import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, List, Tag, Space, Badge } from 'antd';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axiosInstance';

const { Title, Text } = Typography;

const userRoleColor = {
  ADMIN: '#ff4d4f',
  TEACHER: '#1677ff',
  STUDENT: '#52c41a',
};

const examStatusColor = {
  DRAFT: '#8c8c8c',
  PENDING_APPROVAL: '#1677ff',
  REJECTED: '#ff4d4f',
  PUBLISHED: '#52c41a',
  CLOSED: '#faad14',
};

const questionTypeColor = {
  SINGLE_SELECT: '#1677ff',
  MULTI_SELECT: '#722ed1',
  TRUE_FALSE: '#13c2c2',
  OPEN: '#fa8c16',
};

export default function SchoolAdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState({
    users: [],
    exams: [],
    questions: [],
    assignments: [],
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    teachers: 0,
    students: 0,
    totalExams: 0,
    publishedExams: 0,
    pendingExams: 0,
    draftExams: 0,
    totalAssignments: 0,
    completedAssignments: 0,
  });
  const [chartData, setChartData] = useState({
    usersByRole: [],
    examsByStatus: [],
    questionsByType: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, examsRes, questionsRes] = await Promise.all([
          api.get('/school-admin/users', { params: { size: 200 } }),
          api.get('/school-admin/exams', { params: { size: 200 } }),
          api.get('/admin/questions', { params: { size: 500 } }).catch(() => ({ data: { content: [] } })),
        ]);

        const users = usersRes.data.content || [];
        const exams = examsRes.data.content || [];
        const questions = questionsRes.data.content || [];

        const teachers = users.filter((u) => u.role === 'TEACHER').length;
        const students = users.filter((u) => u.role === 'STUDENT').length;
        const admins = users.filter((u) => u.role === 'ADMIN').length;
        const publishedExams = exams.filter((e) => e.status === 'PUBLISHED').length;
        const pendingExams = exams.filter((e) => e.status === 'PENDING_APPROVAL').length;
        const draftExams = exams.filter((e) => e.status === 'DRAFT').length;

        // Build chart data
        const usersByRole = [
          { name: t('roles.TEACHER'), value: teachers, color: '#1677ff' },
          { name: t('roles.STUDENT'), value: students, color: '#52c41a' },
          { name: t('roles.ADMIN'), value: admins, color: '#ff4d4f' },
        ].filter((d) => d.value > 0);

        const examsByStatus = [
          { name: t(`examStatus.DRAFT`), value: draftExams, color: '#8c8c8c' },
          { name: t(`examStatus.PENDING_APPROVAL`), value: pendingExams, color: '#1677ff' },
          { name: t(`examStatus.PUBLISHED`), value: publishedExams, color: '#52c41a' },
        ].filter((d) => d.value > 0);

        const questionsByType = [
          'SINGLE_SELECT', 'MULTI_SELECT', 'TRUE_FALSE', 'OPEN',
        ].map((type) => {
          const count = questions.filter((q) => q.type === type).length;
          return {
            name: t(`questionTypes.${type}`, type),
            value: count,
            color: questionTypeColor[type],
          };
        }).filter((d) => d.value > 0);

        let totalAssignments = 0;
        let completedAssignments = 0;
        for (const exam of exams) {
          try {
            const aRes = await api.get(`/school-admin/exams/${exam.id}/assignments`);
            const assignments = aRes.data || [];
            totalAssignments += assignments.length;
            completedAssignments += assignments.filter((a) => a.status === 'FULLY_GRADED').length;
          } catch {
            // Skip if endpoint not available
          }
        }

        setData({ users, exams, questions, assignments: [] });
        setStats({
          totalUsers: users.length,
          teachers,
          students,
          totalExams: exams.length,
          publishedExams,
          pendingExams,
          draftExams,
          totalAssignments,
          completedAssignments,
        });
        setChartData({ usersByRole, examsByStatus, questionsByType });
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [t]);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const recentExams = [...data.exams]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentUsers = [...data.users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{t('schoolAdminDash.title')}</Title>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: t('schoolAdminDash.totalUsers'), value: stats.totalUsers, color: '#1677ff' },
          { title: t('schoolAdminDash.totalTeachers'), value: stats.teachers, color: '#722ed1' },
          { title: t('schoolAdminDash.totalStudents'), value: stats.students, color: '#52c41a' },
          { title: t('schoolAdminDash.totalExams'), value: stats.totalExams, color: '#fa8c16' },
          { title: t('schoolAdminDash.publishedExams'), value: stats.publishedExams, color: '#52c41a' },
          { title: t('schoolAdminDash.pendingExams'), value: stats.pendingExams, color: '#1677ff' },
          { title: t('schoolAdminDash.draftExams'), value: stats.draftExams, color: '#8c8c8c' },
          { title: t('schoolAdminDash.totalAssignments'), value: stats.totalAssignments, color: '#eb2f96' },
        ].map(({ title, value, color }) => (
          <Col key={title} xs={12} sm={8} md={6} lg={3}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{title}</Text>}
                value={value}
                valueStyle={{ color, fontSize: 24, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Users by Role */}
        <Col xs={24} md={8}>
          <Card title={t('schoolAdminDash.usersByRole')} style={{ height: 320 }}>
            {chartData.usersByRole.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80, color: '#bbb' }}>
                {t('schoolAdminDash.noUsers')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData.usersByRole}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.usersByRole.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Exams by Status */}
        <Col xs={24} md={8}>
          <Card title={t('schoolAdminDash.examsByStatus')} style={{ height: 320 }}>
            {chartData.examsByStatus.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80, color: '#bbb' }}>
                {t('schoolAdminDash.noExams')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData.examsByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.examsByStatus.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Questions by Type */}
        <Col xs={24} md={8}>
          <Card title={t('schoolAdminDash.questionsByType')} style={{ height: 320 }}>
            {chartData.questionsByType.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80, color: '#bbb' }}>
                {t('schoolAdminDash.noQuestions')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData.questionsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.questionsByType.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Data */}
      <Row gutter={[16, 16]}>
        {/* Recent Exams */}
        <Col xs={24} md={12}>
          <Card title={t('schoolAdminDash.recentExams')}>
            <List
              dataSource={recentExams}
              locale={{ emptyText: t('schoolAdminDash.noExams') }}
              renderItem={(exam) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.3s',
                  }}
                  onClick={() => navigate(`/school-admin/exams/${exam.id}/assignments`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <List.Item.Meta
                    title={<Text strong>{exam.title}</Text>}
                    description={
                      <Space size={4}>
                        <Tag color={examStatusColor[exam.status]} style={{ margin: 0 }}>
                          {t(`examStatus.${exam.status}`, exam.status)}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {exam.questionCount} questions
                        </Text>
                      </Space>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(exam.createdAt).format('MMM D')}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Users */}
        <Col xs={24} md={12}>
          <Card title={t('schoolAdminDash.recentUsers')}>
            <List
              dataSource={recentUsers}
              locale={{ emptyText: t('schoolAdminDash.noUsers') }}
              renderItem={(user) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.3s',
                  }}
                  onClick={() => navigate('/school-admin/users')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <List.Item.Meta
                    title={<Text strong>{user.fullName || user.username}</Text>}
                    description={
                      <Space size={4}>
                        <Tag color={userRoleColor[user.role]} style={{ margin: 0 }}>
                          {t(`roles.${user.role}`, user.role)}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {user.email}
                        </Text>
                      </Space>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(user.createdAt).format('MMM D')}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
