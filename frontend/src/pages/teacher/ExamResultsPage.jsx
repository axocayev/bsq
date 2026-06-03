import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Modal, List, Tag, Typography, Badge, Space, Tooltip, message, Spin, Table,
} from 'antd';
import { ArrowLeftOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getExamAssignments, getAssignmentAnswers, gradeAnswer } from '../../api/exams';

const { Title, Text } = Typography;

const attemptColor = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'processing',
  SUBMITTED: 'warning',
  FULLY_GRADED: 'success',
  TIMED_OUT: 'error',
};

export default function ExamResultsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answersModal, setAnswersModal] = useState(null);
  const [answersLoading, setAnswersLoading] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const { data } = await getExamAssignments(examId);
        setAssignments(data);
        if (data.length > 0 && data[0].examTitle) {
          setExam({ title: data[0].examTitle });
        }
      } catch (e) {
        message.error(t('results.failedLoad'));
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [examId, t]);

  const openAnswers = async (assignment) => {
    setAnswersLoading(true);
    try {
      const { data } = await getAssignmentAnswers(assignment.id);
      setAnswersModal({ assignmentId: assignment.id, studentName: assignment.studentName, answers: data });
    } catch {
      message.error(t('results.failedAnswers'));
    } finally {
      setAnswersLoading(false);
    }
  };

  const onGradeAnswer = async (answerId, correct) => {
    try {
      await gradeAnswer(answerId, { correct });
      const { data } = await getAssignmentAnswers(answersModal.assignmentId);
      setAnswersModal((prev) => ({ ...prev, answers: data }));
      const { data: assignments } = await getExamAssignments(examId);
      setAssignments(assignments);
      message.success(t('grading.saved'));
    } catch {
      message.error(t('common.failed'));
    }
  };

  const assignmentColumns = [
    { title: t('results.student'), dataIndex: 'studentName' },
    { title: t('common.status'), dataIndex: 'status', render: (v) => <Badge status={attemptColor[v]} text={v} /> },
    {
      title: t('results.score'),
      render: (_, r) => {
        if (r.finalScore != null) return <Text strong>{r.finalScore}</Text>;
        if (r.autoScore != null) return <Text type="secondary">{r.autoScore} (auto)</Text>;
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: t('results.answers'),
      render: (_, r) => {
        const canView = ['SUBMITTED', 'FULLY_GRADED', 'TIMED_OUT'].includes(r.status);
        return (
          <Button
            size="small"
            icon={<EyeOutlined />}
            disabled={!canView}
            loading={answersLoading}
            onClick={() => openAnswers(r)}
          >
            {t('common.view')}
          </Button>
        );
      },
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/teacher/exams')}
          style={{ marginBottom: 16 }}
        >
          {t('common.back')}
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {exam?.title} — {t('common.results')}
        </Title>
      </div>

      <div style={{ background: '#fafafa', padding: 16, borderRadius: 6, marginBottom: 16 }}>
        <Text type="secondary">
          {assignments.length} {t('results.totalAssignments', { count: assignments.length })}
        </Text>
      </div>

      <Table
        dataSource={assignments}
        columns={assignmentColumns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('results.noStudents') }}
      />

      {/* Answers modal */}
      <Modal
        title={`${t('results.answers')} — ${answersModal?.studentName}`}
        open={!!answersModal}
        onCancel={() => setAnswersModal(null)}
        footer={null}
        width={720}
      >
        <List
          dataSource={answersModal?.answers || []}
          renderItem={(a, idx) => (
            <List.Item key={a.questionId} style={{ display: 'block', padding: '12px 0' }}>
              <Text strong>
                {idx + 1}. {a.questionText}
              </Text>
              <div style={{ marginTop: 6 }}>
                {a.questionType === 'OPEN' ? (
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: '8px 12px' }}>
                      <Text type="secondary">{t('examResult.yourAnswer')}</Text>
                      <div style={{ marginTop: 2 }}>{a.answerText || <em style={{ color: '#bbb' }}>—</em>}</div>
                    </div>
                    {a.pendingGrade ? (
                      <Space>
                        <Tag color="orange">{t('examResult.pending')}</Tag>
                        <Tooltip title={`+${a.maxPoints} ${t('examResult.pts')}`}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => onGradeAnswer(a.answerId, true)}
                          >
                            {t('grading.correct')}
                          </Button>
                        </Tooltip>
                        <Tooltip title={`+0 ${t('examResult.pts')}`}>
                          <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => onGradeAnswer(a.answerId, false)}
                          >
                            {t('grading.wrong')}
                          </Button>
                        </Tooltip>
                      </Space>
                    ) : (
                      <Space>
                        <Tag color={a.correct ? 'success' : 'error'}>
                          {a.correct ? '✓ ' + t('grading.correct') : '✗ ' + t('grading.wrong')}
                        </Tag>
                        <Text type="secondary">
                          {a.pointsAwarded} / {a.maxPoints} {t('examResult.pts')}
                        </Text>
                        <Button size="small" onClick={() => onGradeAnswer(a.answerId, !a.correct)}>
                          {t('grading.change')}
                        </Button>
                      </Space>
                    )}
                  </Space>
                ) : (
                  <Space>
                    <Tag color={a.correct ? 'green' : 'red'}>{a.correct ? '✓' : '✗'}</Tag>
                    <Text type="secondary">
                      {a.pointsAwarded} / {a.maxPoints} {t('examResult.pts')}
                    </Text>
                  </Space>
                )}
                {a.explanation && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">
                      {t('examResult.explanation')} {a.explanation}
                    </Text>
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}
