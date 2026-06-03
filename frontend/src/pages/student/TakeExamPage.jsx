import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Radio, Checkbox, Input, Typography, Progress, Space, Statistic, message, Spin, Tag, Image } from 'antd';
import { ClockCircleOutlined, CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { startExam, submitExam, saveAnswer } from '../../api/exams';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

export default function TakeExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deadline, setDeadline] = useState(null);
  // per-question save status: 'saving' | 'saved' | null
  const [saveStatus, setSaveStatus] = useState({});
  const debounceTimers = useRef({});

  useEffect(() => {
    startExam(examId, '') // OTP already verified; empty string skips validation for IN_PROGRESS resume
      .then(({ data }) => {
        setExamData(data);

        // Restore saved answers from backend
        const restored = {};
        const restoredStatus = {};
        (data.savedAnswers || []).forEach((a) => {
          if (a.answerText) {
            restored[a.questionId] = a.answerText;
            restoredStatus[a.questionId] = 'saved';
          } else if (a.selectedOptionIds?.length) {
            const q = data.questions.find((q) => q.id === a.questionId);
            if (q?.type === 'MULTI_SELECT') {
              restored[a.questionId] = a.selectedOptionIds;
            } else {
              restored[a.questionId] = a.selectedOptionIds[0];
            }
            restoredStatus[a.questionId] = 'saved';
          }
        });
        setAnswers(restored);
        setSaveStatus(restoredStatus);

        const clientOffset = Date.now() - data.serverNow;
        setDeadline(data.examEndsAt + clientOffset);
      })
      .catch((e) => {
        message.error(e.response?.data?.message || t('takeExam.failedStart'));
        navigate('/student/exams');
      });
  }, [examId]);

  const persistAnswer = useCallback((questionId, questionType, value) => {
    const payload = questionType === 'OPEN'
      ? { questionId, answerText: value || '' }
      : { questionId, selectedOptionIds: Array.isArray(value) ? value : (value ? [value] : []) };

    setSaveStatus((prev) => ({ ...prev, [questionId]: 'saving' }));
    saveAnswer(examId, payload)
      .then(() => setSaveStatus((prev) => ({ ...prev, [questionId]: 'saved' })))
      .catch(() => setSaveStatus((prev) => ({ ...prev, [questionId]: null })));
  }, [examId]);

  const handleChange = useCallback((question, value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));

    if (question.type === 'OPEN') {
      // Debounce open-text saves by 600ms
      clearTimeout(debounceTimers.current[question.id]);
      setSaveStatus((prev) => ({ ...prev, [question.id]: 'saving' }));
      debounceTimers.current[question.id] = setTimeout(() => {
        persistAnswer(question.id, question.type, value);
      }, 600);
    } else {
      // Save immediately for choice questions
      persistAnswer(question.id, question.type, value);
    }
  }, [persistAnswer]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload = examData.questions.map((q) => {
        const ans = answers[q.id];
        if (q.type === 'OPEN') return { questionId: q.id, answerText: ans || '' };
        const selected = Array.isArray(ans) ? ans : ans ? [ans] : [];
        return { questionId: q.id, selectedOptionIds: selected };
      });
      await submitExam(examId, { answers: payload });
      message.success(t('takeExam.submitted'));
      navigate(`/student/exams/${examId}/result`);
    } catch (e) {
      message.error(e.response?.data?.message || t('takeExam.submitFailed'));
    } finally { setSubmitting(false); }
  }, [examData, answers, examId]);

  if (!examData) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const answered = Object.keys(answers).filter((k) => {
    const v = answers[k];
    return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  }).length;
  const total = examData.questions.length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, position: 'sticky', top: 64, zIndex: 10 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{examData.examTitle}</Title>
            <Text type="secondary">{t('takeExam.answered', { answered, total })}</Text>
          </div>
          <Space>
            <Countdown title={<><ClockCircleOutlined /> {t('takeExam.timeLeft')}</>} value={deadline} onFinish={handleSubmit} format="mm:ss" />
            <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={submitting}>
              {t('takeExam.submitExam')}
            </Button>
          </Space>
        </Space>
        <Progress percent={Math.round((answered / total) * 100)} size="small" style={{ marginTop: 8 }} />
      </Card>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {examData.questions.map((q, idx) => {
          const status = saveStatus[q.id];
          const cardExtra = (
            <Space size={8}>
              <Tag>{q.points} pt{q.points > 1 ? 's' : ''}</Tag>
              {status === 'saving' && <LoadingOutlined style={{ color: '#1677ff' }} />}
              {status === 'saved' && <CheckCircleFilled style={{ color: '#52c41a' }} />}
            </Space>
          );
          return (
            <Card key={q.id} title={`Q${idx + 1}. ${q.text}`} extra={cardExtra}>
              {q.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <Image src={q.imageUrl} style={{ maxHeight: 240, objectFit: 'contain', borderRadius: 4 }} />
                </div>
              )}
              {q.type === 'SINGLE_SELECT' || q.type === 'TRUE_FALSE' ? (
                <Radio.Group value={answers[q.id]} onChange={(e) => handleChange(q, e.target.value)}>
                  <Space direction="vertical">
                    {q.options.map((o) => (
                      <Radio key={o.id} value={o.id}>
                        <Space>
                          {o.text}
                          {o.imageUrl && <Image src={o.imageUrl} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />}
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              ) : q.type === 'MULTI_SELECT' ? (
                <Checkbox.Group value={answers[q.id] || []} onChange={(vals) => handleChange(q, vals)}>
                  <Space direction="vertical">
                    {q.options.map((o) => (
                      <Checkbox key={o.id} value={o.id}>
                        <Space>
                          {o.text}
                          {o.imageUrl && <Image src={o.imageUrl} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />}
                        </Space>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              ) : (
                <Input.TextArea
                  rows={4}
                  placeholder={t('takeExam.writeAnswer')}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleChange(q, e.target.value)}
                />
              )}
            </Card>
          );
        })}
      </Space>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
          {t('takeExam.submitExam')}
        </Button>
      </div>
    </div>
  );
}
