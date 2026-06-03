import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Tag, List, Spin, Space } from 'antd';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getMyQuestions } from '../../api/questions';
import { getMyExams } from '../../api/exams';
import { typeColor, typeLabel } from '../../utils/questionTypes';

const { Title, Text } = Typography;

const STATUS_COLOR = {
  DRAFT: '#8c8c8c', PENDING_APPROVAL: '#1677ff',
  REJECTED: '#ff4d4f', PUBLISHED: '#52c41a', CLOSED: '#faad14',
};
const TYPE_PIE_COLORS = ['#1677ff', '#722ed1', '#13c2c2', '#fa8c16'];

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyQuestions({ size: 500 }),
      getMyExams({ size: 500 }),
    ]).then(([q, e]) => {
      setQuestions(q.data.content);
      setExams(e.data.content);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  // ── Question stats ────────────────────────────────────────
  const qTotal    = questions.length;
  const qInUse    = questions.filter((q) => q.inUse).length;
  const qByType   = ['SINGLE_SELECT', 'MULTI_SELECT', 'TRUE_FALSE', 'OPEN'].map((type) => ({
    name: typeLabel(type, t),
    value: questions.filter((q) => q.type === type).length,
  })).filter((d) => d.value > 0);

  // ── Exam stats ────────────────────────────────────────────
  const eTotal      = exams.length;
  const ePublished  = exams.filter((e) => e.status === 'PUBLISHED').length;
  const ePending    = exams.filter((e) => e.status === 'PENDING_APPROVAL').length;
  const eDraft      = exams.filter((e) => e.status === 'DRAFT').length;

  const examStatusCounts = ['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'PUBLISHED', 'CLOSED']
    .map((s) => ({ name: t(`examStatus.${s}`, s), value: exams.filter((e) => e.status === s).length, color: STATUS_COLOR[s] }))
    .filter((d) => d.value > 0);

  const recentExams     = [...exams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentQuestions = [...questions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{t('teacherDash.title')}</Title>

      {/* ── Top stats ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: t('teacherDash.totalQuestions'), value: qTotal, color: '#1677ff' },
          { title: t('teacherDash.inUseQuestions'), value: qInUse, color: '#52c41a' },
          { title: t('teacherDash.totalExams'), value: eTotal, color: '#722ed1' },
          { title: t('teacherDash.publishedExams'), value: ePublished, color: '#52c41a' },
          { title: t('teacherDash.pendingExams'), value: ePending, color: '#1677ff' },
          { title: t('teacherDash.draftExams'), value: eDraft, color: '#8c8c8c' },
        ].map(({ title, value, color }) => (
          <Col key={title} xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title={<Text style={{ fontSize: 12 }}>{title}</Text>} value={value} valueStyle={{ color, fontSize: 28, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Questions by type */}
        <Col xs={24} md={12}>
          <Card title={t('teacherDash.questionsByType')} style={{ height: 320 }}>
            {qByType.length === 0
              ? <div style={{ textAlign: 'center', paddingTop: 60, color: '#bbb' }}>{t('teacherDash.noQuestions')}</div>
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={qByType} cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {qByType.map((_, i) => <Cell key={i} fill={TYPE_PIE_COLORS[i % TYPE_PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </Card>
        </Col>

        {/* Exams by status */}
        <Col xs={24} md={12}>
          <Card title={t('teacherDash.examsByStatus')} style={{ height: 320 }}>
            {examStatusCounts.length === 0
              ? <div style={{ textAlign: 'center', paddingTop: 60, color: '#bbb' }}>{t('teacherDash.noExams')}</div>
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={examStatusCounts} cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3} dataKey="value">
                      {examStatusCounts.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent exams */}
        <Col xs={24} md={12}>
          <Card title={t('teacherDash.recentExams')}>
            <List
              dataSource={recentExams}
              locale={{ emptyText: t('teacherDash.noExams') }}
              renderItem={(e) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{e.title}</Text>}
                    description={
                      <Space size={4} wrap>
                        <Tag color={STATUS_COLOR[e.status]} style={{ margin: 0 }}>{t(`examStatus.${e.status}`, e.status)}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{e.questionCount} {t('exams.questionCount').toLowerCase()}</Text>
                      </Space>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {dayjs(e.createdAt).format('MMM D')}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent questions */}
        <Col xs={24} md={12}>
          <Card title={t('teacherDash.recentQuestions')}>
            <List
              dataSource={recentQuestions}
              locale={{ emptyText: t('teacherDash.noQuestions') }}
              renderItem={(q) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong ellipsis style={{ maxWidth: 260 }}>{q.text}</Text>}
                    description={
                      <Space size={4}>
                        <Tag color={typeColor[q.type]} style={{ margin: 0 }}>{typeLabel(q.type, t)}</Tag>
                        {q.inUse && <Tag color="orange" style={{ margin: 0 }}>{t('questions.inUse')}</Tag>}
                      </Space>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {dayjs(q.createdAt).format('MMM D')}
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
