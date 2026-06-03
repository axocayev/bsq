import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Typography, Space, Statistic, Row, Col, Alert, Button, Spin, Image, List } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getExamResult } from '../../api/exams';
import { typeColor, typeLabel } from '../../utils/questionTypes';

const { Title, Text } = Typography;

export default function ExamResultPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [result, setResult] = useState(null);

  useEffect(() => {
    getExamResult(examId).then(({ data }) => setResult(data))
      .catch(() => navigate('/student/exams'));
  }, [examId]);

  if (!result) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const pct = result.maxScore > 0 ? Math.round(((result.finalScore ?? result.autoScore ?? 0) / result.maxScore) * 100) : 0;
  const getMark = (score) => {
    if (score <= 30) return 2;
    if (score <= 60) return 3;
    if (score <= 80) return 4;
    return 5;
  };
  const mark = getMark(pct);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ marginBottom: 24, textAlign: 'center' }}>
        <Title level={3}>{result.examTitle}</Title>
        {result.status === 'SUBMITTED' && (
          <Alert message={t('examResult.pendingReview')} type="warning" showIcon style={{ marginBottom: 16 }} />
        )}
        <Row gutter={32} justify="center">
          <Col><Statistic title={t('examResult.finalScore')} value={result.finalScore ?? t('examResult.pending')} suffix={result.finalScore != null ? `/ ${result.maxScore}` : ''} /></Col>
          <Col>
            <Statistic
              title={t('examResult.mark')}
              value={result.finalScore != null ? mark : '—'}
              valueStyle={{ color: mark >= 4 ? '#52c41a' : mark === 3 ? '#faad14' : '#ff4d4f', fontSize: 36, fontWeight: 700 }}
            />
          </Col>
        </Row>
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/student/exams')}>
          {t('examResult.backToExams')}
        </Button>
      </Card>

      <Title level={4}>{t('examResult.answerReview')}</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {result.answers.map((a, idx) => (
          <Card
            key={a.questionId}
            title={
              <Space>
                {a.pendingGrade
                  ? <ClockCircleOutlined style={{ color: '#faad14' }} />
                  : a.correct
                    ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                <span>Q{idx + 1}. {a.questionText}</span>
                <Tag color={typeColor[a.questionType]}>{typeLabel(a.questionType, t)}</Tag>
              </Space>
            }
            extra={a.pendingGrade
              ? <Tag color="warning">{t('examResult.pending')}</Tag>
              : <Tag color={a.correct ? 'success' : 'error'}>{a.pointsAwarded ?? 0} {t('examResult.pts')}</Tag>}
          >
            {a.questionImageUrl && (
              <div style={{ marginBottom: 8 }}>
                <Image src={a.questionImageUrl} style={{ maxHeight: 160, objectFit: 'contain', borderRadius: 4 }} />
              </div>
            )}
            {a.questionType === 'OPEN' ? (
              <p><Text strong>{t('examResult.yourAnswer')}</Text> {a.answerText || <em>—</em>}</p>
            ) : (
              <List
                size="small"
                dataSource={a.options || []}
                renderItem={(opt) => {
                  let icon = null;
                  let bg = 'transparent';
                  if (opt.correct && opt.selected) {
                    icon = <CheckOutlined style={{ color: '#52c41a' }} />;
                    bg = '#f6ffed';
                  } else if (opt.correct && !opt.selected) {
                    icon = <CheckOutlined style={{ color: '#52c41a' }} />;
                    bg = '#f6ffed';
                  } else if (!opt.correct && opt.selected) {
                    icon = <CloseOutlined style={{ color: '#ff4d4f' }} />;
                    bg = '#fff2f0';
                  }
                  return (
                    <List.Item style={{ background: bg, borderRadius: 4, padding: '6px 8px', marginBottom: 4, border: opt.selected ? `1px solid ${opt.correct ? '#b7eb8f' : '#ffccc7'}` : '1px solid transparent' }}>
                      <Space>
                        {icon || <span style={{ width: 14, display: 'inline-block' }} />}
                        {opt.imageUrl && <Image src={opt.imageUrl} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} />}
                        <Text style={{ fontWeight: opt.selected ? 600 : 400 }}>{opt.text}</Text>
                        {opt.selected && !opt.correct && <Tag color="error">{t('examResult.yourChoice')}</Tag>}
                        {opt.selected && opt.correct && <Tag color="success">{t('examResult.yourChoice')}</Tag>}
                        {!opt.selected && opt.correct && <Tag color="success">{t('examResult.correctAnswer')}</Tag>}
                      </Space>
                    </List.Item>
                  );
                }}
                style={{ marginBottom: 8 }}
              />
            )}
            {a.teacherComment && <Alert message={`${t('examResult.teacher')} ${a.teacherComment}`} type="info" showIcon style={{ marginBottom: 8 }} />}
            {a.explanation && <Alert message={`${t('examResult.explanation')} ${a.explanation}`} type="success" showIcon />}
          </Card>
        ))}
      </Space>
    </div>
  );
}
