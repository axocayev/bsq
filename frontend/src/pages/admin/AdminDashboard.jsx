import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, message, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { getUsers } from '../../api/users';
import { getAllExams } from '../../api/exams';
import { getAllSubjects } from '../../api/subjects';
import { getSchools } from '../../api/schools';

const { Title } = Typography;
const COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    schools: 0,
    users: 0,
    exams: 0,
    subjects: 0,
    students: 0,
  });
  const [examStatusData, setExamStatusData] = useState([]);
  const [userRoleData, setUserRoleData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usersRes, examsRes, subjectsRes, schoolsRes] = await Promise.all([
        getUsers({ size: 1000, page: 0 }),
        getAllExams({ size: 1000, page: 0 }),
        getAllSubjects(),
        getSchools({ size: 1, page: 0 }),
      ]);

      const usersTotal = usersRes.data.totalElements || 0;
      const examsTotal = examsRes.data.totalElements || 0;
      const subjectsTotal = subjectsRes.data.length || 0;
      const schoolsTotal = schoolsRes.data.totalElements || 0;

      // Count students (users with STUDENT role)
      const users = usersRes.data.content || [];
      const studentCount = users.filter(u => u.role === 'STUDENT').length;

      setStats({
        schools: schoolsTotal,
        users: usersTotal,
        exams: examsTotal,
        subjects: subjectsTotal,
        students: studentCount,
      });

      // Process exam status distribution
      const exams = examsRes.data.content || [];
      const statusCounts = {};
      exams.forEach((exam) => {
        const status = exam.status || 'UNKNOWN';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const examChartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: t(`examStatus.${status}`, status),
        value: count,
        status,
      }));

      setExamStatusData(examChartData.length > 0 ? examChartData : []);

      // Process user role distribution
      const roleCounts = {};
      users.forEach((user) => {
        const role = user.role || 'UNKNOWN';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      const roleChartData = Object.entries(roleCounts).map(([role, count]) => ({
        name: t(`roles.${role}`, role),
        value: count,
        role,
      }));

      setUserRoleData(roleChartData.length > 0 ? roleChartData : []);
    } catch (e) {
      message.error(t('common.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExamsPieClick = () => {
    navigate('/admin/exams');
  };

  const handleUsersPieClick = () => {
    navigate('/admin/users');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{t('adminDash.title')}</Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {[
          { title: t('adminDash.totalSchools'), value: stats.schools, color: '#1677ff' },
          { title: t('adminDash.totalUsers'), value: stats.users, color: '#52c41a' },
          { title: t('adminDash.totalStudents'), value: stats.students, color: '#faad14' },
          { title: t('adminDash.totalExams'), value: stats.exams, color: '#722ed1' },
          { title: t('adminDash.totalSubjects'), value: stats.subjects, color: '#13c2c2' },
        ].map(({ title, value, color }) => (
          <Col key={title} xs={12} sm={8} md={6} lg={4.8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title={title} value={value} valueStyle={{ color, fontSize: 28, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={t('adminDash.examsByStatus')}
            bordered={false}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}
            onClick={handleExamsPieClick}
          >
            {examStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={examStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {examStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} exams`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description={t('adminDash.noExams')} />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={t('adminDash.usersByRole')}
            bordered={false}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}
            onClick={handleUsersPieClick}
          >
            {userRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} users`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description={t('adminDash.noUsers')} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
