import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, List, Row, Space, Spin, Statistic, Tag, Typography, Alert,
} from 'antd';
import { ArrowLeftOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getSchoolAdminAssignmentResult } from '../../api/exams';
import { typeColor, typeLabel } from '../../utils/questionTypes';

const { Title, Text } = Typography;

const getMark = (finalScore, maxScore) => {
  if (finalScore == null || !maxScore) return null;
  const pct = (finalScore / maxScore) * 100;
  if (pct <= 30) return 2;
  if (pct <= 60) return 3;
  if (pct <= 80) return 4;
  return 5;
};

const markColor = { 2: '#ff4d4f', 3: '#faad14', 4: '#52c41a', 5: '#1677ff' };

export default function AssignmentResultPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchoolAdminAssignmentResult(assignmentId)
      .then(({ data }) => setResult(data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (!result) return null;

  const score = result.finalScore ?? result.autoScore ?? 0;
  const mark = getMark(score, result.maxScore);
  const hasPending = result.answers?.some((a) => a.pendingGrade);

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </Space>

      <Title level={4}>{result.examTitle}</Title>

      {hasPending && (
        <Alert type="warning" message={t('examResult.pendingReview')} showIcon style={{ marginBottom: 16 }} />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <Statistic title={t('examResult.finalScore')} value={score} suffix={`/ ${result.maxScore}`} />
        </Col>
        {mark && (
          <Col>
            <Statistic
              title={t('examResult.mark')}
              value={mark}
              valueStyle={{ color: markColor[mark], fontSize: 36, fontWeight: 700 }}
            />
          </Col>
        )}
        {result.submittedAt && (
          <Col>
            <Statistic title={t('takeExam.submitExam')} value={dayjs(result.submittedAt).format('YYYY-MM-DD HH:mm')} />
          </Col>
        )}
      </Row>

      <List
        dataSource={result.answers || []}
        renderItem={(a, idx) => (
          <Card key={a.questionId} size="small" style={{ marginBottom: 12 }}>
            <Space style={{ marginBottom: 6 }}>
              <Text strong>Q{idx + 1}.</Text>
              <Tag color={typeColor[a.questionType]}>{typeLabel(a.questionType, t)}</Tag>
              <Text type="secondary">{a.pointsAwarded ?? '?'} / {a.maxPoints} {t('examResult.pts')}</Text>
            </Space>
            <div style={{ marginBottom: 8 }}>{a.questionText}</div>

            {a.questionType === 'OPEN' ? (
              <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: '8px 12px' }}>
                <Text type="secondary">{t('examResult.yourAnswer')}</Text>
                <div style={{ marginTop: 4 }}>{a.answerText || <em style={{ color: '#bbb' }}>—</em>}</div>
                {a.pendingGrade
                  ? <Tag color="orange" style={{ marginTop: 6 }}>{t('examResult.pending')}</Tag>
                  : <Tag color={a.correct ? 'success' : 'error'} style={{ marginTop: 6 }}>
                      {a.correct ? `✓ ${t('grading.correct')}` : `✗ ${t('grading.wrong')}`}
                    </Tag>}
              </div>
            ) : (
              <div>
                {a.options?.map((o) => {
                  const isSelected = o.selected;
                  const isCorrect = o.correct;
                  let bg = 'transparent';
                  let icon = null;
                  if (isCorrect && isSelected) { bg = '#f6ffed'; icon = <CheckCircleFilled style={{ color: '#52c41a' }} />; }
                  else if (isCorrect) { bg = '#f6ffed'; icon = <CheckCircleFilled style={{ color: '#52c41a' }} />; }
                  else if (isSelected) { bg = '#fff2f0'; icon = <CloseCircleFilled style={{ color: '#ff4d4f' }} />; }
                  return (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, background: bg, marginBottom: 2 }}>
                      {icon || <span style={{ width: 16 }} />}
                      <Text style={{ fontWeight: isSelected ? 600 : 400 }}>{o.text}</Text>
                    </div>
                  );
                })}
              </div>
            )}
            {a.explanation && (
              <Alert type="info" message={a.explanation} showIcon style={{ marginTop: 8 }} />
            )}
          </Card>
        )}
      />
    </>
  );
}
