import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, List, Tag, Spin, Alert } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { getMyAssignments } from '../../api/exams';

const { Title, Text } = Typography;

const STATUS_DONE = ['SUBMITTED', 'FULLY_GRADED', 'TIMED_OUT'];
const STATUS_PROGRESS = ['IN_PROGRESS'];
const STATUS_UPCOMING = ['NOT_STARTED'];

const getMark = (finalScore, maxScore) => {
  if (finalScore == null || maxScore == null || maxScore === 0) return null;
  const pct = (finalScore / maxScore) * 100;
  if (pct <= 30) return 2;
  if (pct <= 60) return 3;
  if (pct <= 80) return 4;
  return 5;
};

const markColor = { 2: '#ff4d4f', 3: '#faad14', 4: '#52c41a', 5: '#1677ff' };

const COLORS = ['#52c41a', '#1677ff', '#faad14'];

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    getMyAssignments({ size: 500 })
      .then(({ data }) => setAssignments(data.content || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (error) return <Alert type="error" message="Failed to load dashboard" style={{ margin: 24 }} />;

  const done = assignments.filter((a) => STATUS_DONE.includes(a.status));
  const inProgress = assignments.filter((a) => STATUS_PROGRESS.includes(a.status));
  const upcoming = assignments.filter((a) => STATUS_UPCOMING.includes(a.status));

  const graded = done.filter((a) => a.finalScore != null);
  const marks = graded.map((a) => getMark(a.finalScore, 100)).filter(Boolean);
  const avgMark = marks.length ? (marks.reduce((s, m) => s + m, 0) / marks.length).toFixed(1) : '—';

  const markCounts = [2, 3, 4, 5].map((m) => ({
    mark: m,
    count: marks.filter((x) => x === m).length,
  })).filter((x) => x.count > 0);

  const pieData = [
    { name: t('dashboard.done'), value: done.length },
    { name: t('dashboard.inProgress'), value: inProgress.length },
    { name: t('dashboard.upcoming'), value: upcoming.length },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{t('dashboard.title')}</Title>

      {/* Summary stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('dashboard.total')} value={assignments.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('dashboard.done')} value={done.length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('dashboard.inProgress')} value={inProgress.length} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('dashboard.upcoming')} value={upcoming.length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Pie chart */}
        <Col xs={24} md={12}>
          <Card title={t('dashboard.examStatus')} style={{ height: 360 }}>
            {pieData.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80, color: '#bbb' }}>{t('dashboard.noExams')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Results summary */}
        <Col xs={24} md={12}>
          <Card title={t('dashboard.results')} style={{ height: 360 }}>
            {graded.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#bbb' }}>{t('dashboard.noGraded')}</div>
            ) : (
              <>
                <Statistic
                  title={t('dashboard.avgMark')}
                  value={avgMark}
                  valueStyle={{ fontSize: 40, fontWeight: 700, color: '#1677ff' }}
                  style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">{t('dashboard.markBreakdown')}</Text>
                </div>
                <Row gutter={8}>
                  {[5, 4, 3, 2].map((m) => {
                    const cnt = marks.filter((x) => x === m).length;
                    return (
                      <Col key={m} span={6}>
                        <Card size="small" style={{ textAlign: 'center', borderColor: markColor[m] }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: markColor[m] }}>{m}</div>
                          <div style={{ fontSize: 13, color: '#666' }}>{cnt}x</div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent graded exams */}
      {graded.length > 0 && (
        <Card title={t('dashboard.recentResults')} style={{ marginTop: 16 }}>
          <List
            dataSource={[...graded].reverse().slice(0, 5)}
            renderItem={(a) => {
              const mark = getMark(a.finalScore, 100);
              return (
                <List.Item>
                  <List.Item.Meta
                    title={a.examTitle}
                    description={`${t('examResult.finalScore')}: ${a.finalScore} / 100`}
                  />
                  <Tag color={markColor[mark]} style={{ fontSize: 16, padding: '2px 12px' }}>
                    {t('examResult.mark')}: {mark}
                  </Tag>
                </List.Item>
              );
            }}
          />
        </Card>
      )}
    </div>
  );
}
