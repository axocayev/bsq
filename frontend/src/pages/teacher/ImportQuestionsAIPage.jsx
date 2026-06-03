import { useState } from 'react';
import {
  Button, Card, Space, Input, Select, Checkbox, Modal, Progress, Alert, message, Row, Col, Upload, Spin, Typography, Tag, Divider,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { importQuestionsFromAI, createQuestion } from '../../api/questions';
import { typeLabel, typeColor } from '../../utils/questionTypes';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ALLOWED_EXTS = ['.pdf', '.docx', '.txt'];
const MAX_SIZE = 10 * 1024 * 1024;
const TYPE_OPTIONS = [
  { label: 'Single Choice', value: 'SINGLE_SELECT' },
  { label: 'Multiple Choice', value: 'MULTI_SELECT' },
  { label: 'True/False', value: 'TRUE_FALSE' },
  { label: 'Open-ended', value: 'OPEN' },
];

export default function ImportQuestionsAIPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Phase state: 'upload', 'review', 'done'
  const [phase, setPhase] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  // Review phase state
  const [questions, setQuestions] = useState([]);
  const [savedCount, setSavedCount] = useState(0);

  // Validation helpers
  const validateFile = (file) => {
    const name = file.name.toLowerCase();
    if (!ALLOWED_EXTS.some(ext => name.endsWith(ext))) {
      return t('importAI.invalidFileType');
    }
    if (file.size > MAX_SIZE) {
      return t('importAI.fileTooLarge');
    }
    return null;
  };

  // Upload phase handlers
  const handleFileDrop = ({ file }) => {
    const error = validateFile(file);
    if (error) {
      message.error(error);
      return;
    }
    setSelectedFile(file);
    setParseError(null);
  };

  const handleParseWithAI = async () => {
    if (!selectedFile) {
      message.warning(t('importAI.noFileSelected'));
      return;
    }

    setParsing(true);
    setUploadProgress(0);
    setParseError(null);

    try {
      const response = await importQuestionsFromAI(selectedFile, setUploadProgress);
      if (response.data.length === 0) {
        message.info(t('importAI.noQuestionsFound'));
        setSelectedFile(null);
        setParsing(false);
        return;
      }

      const parsedQuestions = response.data.map((q) => ({
        _id: Math.random(),
        text: q.text || '',
        type: q.type || 'SINGLE_SELECT',
        options: q.options || [],
        explanation: q.explanation || null,
        status: 'pending',
        saving: false,
        saveError: null,
      }));

      setQuestions(parsedQuestions);
      setPhase('review');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || t('importAI.parseError');
      setParseError(errorMsg);
      message.error(errorMsg);
    } finally {
      setParsing(false);
    }
  };

  // Review phase handlers
  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = q.options.map((o, j) => j === oIdx ? { ...o, [field]: value } : o);
      return { ...q, options: opts };
    }));
  };

  const addOption = (qIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: [...(q.options || []), { text: '', correct: false }] };
    }));
  };

  const removeOption = (qIdx, oIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIdx) };
    }));
  };

  // When type changes, handle side effects
  const handleTypeChange = (qIdx, newType) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      if (newType === 'TRUE_FALSE') {
        return { ...q, type: newType, options: [{ text: 'True', correct: false }, { text: 'False', correct: false }] };
      }
      if (newType === 'OPEN') {
        return { ...q, type: newType, options: [] };
      }
      return { ...q, type: newType };
    }));
  };

  const approveQuestion = async (idx) => {
    const q = questions[idx];
    if (!q.text.trim()) {
      message.warning(t('importAI.textRequired'));
      return;
    }
    if (q.type !== 'OPEN' && (!q.options || q.options.length < 2)) {
      message.warning(t('importAI.needsOptions'));
      return;
    }
    if (q.type !== 'OPEN' && !q.options.some(o => o.correct)) {
      message.warning(t('importAI.needsCorrect'));
      return;
    }

    updateQuestion(idx, 'saving', true);
    updateQuestion(idx, 'saveError', null);

    try {
      await createQuestion({
        text: q.text,
        type: q.type,
        options: q.options.map((o, i) => ({ text: o.text, correct: o.correct, displayOrder: i })),
        explanation: q.explanation || null,
        subjectId: null,
      });
      updateQuestion(idx, 'status', 'approved');
      updateQuestion(idx, 'saving', false);
      setSavedCount(c => c + 1);
      message.success(t('importAI.approved'));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || t('common.failed');
      updateQuestion(idx, 'saving', false);
      updateQuestion(idx, 'saveError', errorMsg);
      message.error(errorMsg);
    }
  };

  const skipQuestion = (idx) => {
    updateQuestion(idx, 'status', 'skipped');
  };

  const undoQuestion = (idx) => {
    updateQuestion(idx, 'status', 'pending');
  };

  const finishReview = () => {
    const anyUnsaved = questions.some(q => q.saving);
    if (anyUnsaved) {
      message.warning('Some questions are still being saved. Please wait.');
      return;
    }
    setPhase('done');
  };

  // Render phases
  if (phase === 'upload') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col><Title level={3} style={{ margin: 0 }}>{t('importAI.title')}</Title></Col>
          <Col>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/questions')}>
              {t('common.back')}
            </Button>
          </Col>
        </Row>

        <Card style={{ marginBottom: 16 }}>
          <Title level={5}>{t('importAI.uploadTitle')}</Title>
          <Upload.Dragger
            accept={ALLOWED_EXTS.join(',')}
            showUploadList={false}
            beforeUpload={() => false}
            onDrop={handleFileDrop}
            disabled={parsing}
            style={{ marginBottom: 16 }}
          >
            <p>{t('importAI.uploadHint')}</p>
            {selectedFile && (
              <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                ✓ {selectedFile.name}
              </Text>
            )}
          </Upload.Dragger>

          {parseError && (
            <Alert type="error" message={parseError} showIcon style={{ marginBottom: 16 }} />
          )}

          {parsing && (
            <div style={{ marginBottom: 16 }}>
              <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'active' : 'normal'} />
              <Spin style={{ display: 'block', textAlign: 'center', marginTop: 16 }} tip={t('importAI.parsing')} />
            </div>
          )}

          <Button
            type="primary"
            onClick={handleParseWithAI}
            disabled={!selectedFile || parsing}
            loading={parsing}
            block
          >
            {t('importAI.parseButton')}
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'review') {
    const approvedCount = questions.filter(q => q.status === 'approved').length;
    const skippedCount = questions.filter(q => q.status === 'skipped').length;

    return (
      <div style={{ maxWidth: 800 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col><Title level={3} style={{ margin: 0 }}>{t('importAI.reviewTitle')}</Title></Col>
          <Col>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/questions')}>
              {t('common.back')}
            </Button>
          </Col>
        </Row>

        <Alert
          type="info"
          message={t('importAI.reviewSubtitle', { count: questions.length })}
          style={{ marginBottom: 16 }}
          showIcon
        />

        <Progress
          percent={Math.round((approvedCount / questions.length) * 100)}
          status={approvedCount === questions.length ? 'success' : 'normal'}
          format={() => `${approvedCount} / ${questions.length}`}
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {questions.map((q, idx) => (
            <Card
              key={q._id}
              style={{
                borderLeft: q.status === 'approved' ? '4px solid #52c41a' : q.status === 'skipped' ? '4px solid #d9d9d9' : '4px solid #1677ff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong>Q{idx + 1}</Text>
                <Space>
                  <Tag color={typeColor[q.type]}>{typeLabel(q.type, t)}</Tag>
                  {q.status === 'approved' && <Tag color="success"><CheckOutlined /> {t('importAI.approved')}</Tag>}
                  {q.status === 'skipped' && <Tag><CloseOutlined /> {t('importAI.skipped')}</Tag>}
                </Space>
              </div>

              <TextArea
                value={q.text}
                onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                disabled={q.status !== 'pending'}
                rows={3}
                placeholder={t('questions.questionText')}
                style={{ marginBottom: 12 }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('questions.type')}</Text>
                  <Select
                    value={q.type}
                    onChange={(v) => handleTypeChange(idx, v)}
                    options={TYPE_OPTIONS}
                    disabled={q.status !== 'pending'}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {q.type !== 'OPEN' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('questions.options')}</Text>
                    {q.status === 'pending' && (
                      <Button type="link" size="small" onClick={() => addOption(idx)}>
                        + {t('common.add')}
                      </Button>
                    )}
                  </div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {q.options.map((o, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Checkbox
                          checked={o.correct}
                          onChange={(e) => updateOption(idx, oIdx, 'correct', e.target.checked)}
                          disabled={q.status !== 'pending'}
                        />
                        <Input
                          value={o.text}
                          onChange={(e) => updateOption(idx, oIdx, 'text', e.target.value)}
                          disabled={q.status !== 'pending'}
                          placeholder="Option text"
                          style={{ flex: 1 }}
                        />
                        {q.status === 'pending' && (
                          <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeOption(idx, oIdx)} />
                        )}
                      </div>
                    ))}
                  </Space>
                </div>
              )}

              {q.explanation && (
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('questions.explanation')}</Text>
                  <Input.TextArea
                    value={q.explanation}
                    onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                    disabled={q.status !== 'pending'}
                    rows={2}
                  />
                </div>
              )}

              {q.saveError && <Alert type="error" message={q.saveError} style={{ marginBottom: 12 }} showIcon />}

              {q.status === 'pending' && (
                <Space>
                  <Button
                    type="primary"
                    loading={q.saving}
                    onClick={() => approveQuestion(idx)}
                  >
                    {t('importAI.approve')}
                  </Button>
                  <Button onClick={() => skipQuestion(idx)}>
                    {t('importAI.skip')}
                  </Button>
                </Space>
              )}
              {q.status !== 'pending' && (
                <Button onClick={() => undoQuestion(idx)}>
                  {t('common.undo')}
                </Button>
              )}
            </Card>
          ))}
        </Space>

        <Divider />

        <Button
          type="primary"
          size="large"
          onClick={finishReview}
          block
        >
          {t('importAI.finishReview')}
        </Button>
      </div>
    );
  }

  if (phase === 'done') {
    const skippedCount = questions.filter(q => q.status === 'skipped').length;
    const pendingCount = questions.filter(q => q.status === 'pending').length;

    return (
      <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 48, textAlign: 'center' }}>
        <Title level={2}>✓ {t('importAI.doneTitle')}</Title>
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>{t('importAI.doneSummary', { saved: savedCount })}</Title>
          {skippedCount > 0 && <Text type="secondary">{t('importAI.doneSkipped', { skipped: skippedCount })}</Text>}
          {pendingCount > 0 && <Text type="secondary"> + {pendingCount} {t('common.notReviewed')}</Text>}
        </Card>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/teacher/questions')}
        >
          {t('importAI.goToQuestions')}
        </Button>
      </div>
    );
  }
}
