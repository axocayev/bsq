import { useEffect, useState } from 'react';
import {
  Form, Input, Select, Space, message, Button, Card, Row, Col,
  Upload, Image, Checkbox, Progress, Alert, Tooltip, Typography,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined, DeleteOutlined, PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createQuestion, updateQuestion, getQuestion } from '../../api/questions';
import { getMySubjects } from '../../api/subjects';
import { uploadFile } from '../../api/files';
import { TYPE_KEYS, typeColor, typeLabel } from '../../utils/questionTypes';

const { Title } = Typography;

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function ImageUploadButton({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const { t } = useTranslation();

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error(t('questions.fileTooLarge', { size: '1MB' }));
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error(t('questions.invalidFileType'));
      return false;
    }
    return true;
  };

  const handleUpload = async ({ file }) => {
    if (!validateFile(file)) {
      setUploading(false);
      return;
    }

    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      const { data } = await uploadFile(file, (prog) => {
        setProgress(prog);
      });
      onChange(data.url);
      message.success(t('questions.uploadSuccess'));
      setTimeout(() => setPreview(null), 800);
    } catch (error) {
      console.error('Upload error:', error);
      message.error(t('questions.uploadFailed'));
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const beforeUpload = (file) => {
    if (!validateFile(file)) return false;
    setUploading(true);
    return true;
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {uploading && (
        <Alert
          message={t('questions.uploading')}
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}

      <Tooltip title={`${t('questions.maxFileSize')}: 1MB`}>
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          accept="image/*"
          beforeUpload={beforeUpload}
          multiple={false}
          maxCount={1}
          disabled={uploading}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            size="small"
            type={value ? 'default' : 'primary'}
            disabled={uploading}
          >
            {uploading ? t('questions.uploading') : (value ? t('questions.changeImage') : t('questions.addImage'))}
          </Button>
        </Upload>
      </Tooltip>

      {uploading && progress > 0 && (
        <div style={{ width: '100%' }}>
          <Progress percent={progress} size="small" format={(p) => `${p}%`} strokeColor="#1677ff" />
        </div>
      )}

      {(preview || value) && !uploading && (
        <Space size={8} wrap>
          <Image
            src={preview || value}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
            placeholder
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              onChange(null);
              setPreview(null);
            }}
          >
            {t('common.remove')}
          </Button>
        </Space>
      )}
    </Space>
  );
}

export default function CreateQuestionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);
  const needsOptions = type && type !== 'OPEN';
  const { t } = useTranslation();

  useEffect(() => {
    getMySubjects().then(({ data }) => setSubjects(data));
    if (id) {
      setLoading(true);
      getQuestion(id)
        .then(({ data }) => {
          form.setFieldsValue({
            text: data.text,
            subjectId: data.subjectId || undefined,
            type: data.type,
            explanation: data.explanation,
            imageUrl: data.imageUrl,
            options: data.options?.map((o) => ({
              text: o.text,
              correct: o.correct,
              imageUrl: o.imageUrl,
              displayOrder: o.displayOrder,
            })) || [],
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, form]);

  const onSave = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (id) {
        await updateQuestion(id, values);
        message.success(t('questions.questionUpdated'));
      } else {
        await createQuestion(values);
        message.success(t('questions.questionCreated'));
      }
      navigate('/teacher/questions');
    } catch (e) {
      message.error(e.response?.data?.message || t('common.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/teacher/questions')}
            style={{ marginRight: 8 }}
          />
          <Title level={3} style={{ display: 'inline', margin: 0 }}>
            {id ? t('questions.editQuestion') : t('questions.createQuestion')}
          </Title>
        </Col>
      </Row>

      <Card loading={loading}>
        <Form form={form} layout="vertical" initialValues={{ options: [{ text: '', correct: false }] }}>
          <Form.Item name="text" label={t('questions.questionText')} rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="imageUrl" label={t('questions.questionImage')}>
            <ImageUploadButton />
          </Form.Item>

          <Form.Item name="subjectId" label={t('subjects.name')}>
            <Select
              allowClear
              placeholder={t('subjects.selectSubject')}
              options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>

          <Form.Item name="type" label={t('questions.type')} rules={[{ required: true }]}>
            <Select options={TYPE_KEYS.map((tp) => ({ value: tp, label: typeLabel(tp, t) }))} />
          </Form.Item>

          <Form.Item name="explanation" label={t('questions.explanation')}>
            <Input.TextArea rows={2} />
          </Form.Item>

          {needsOptions && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>{t('questions.options')}</div>
                  {fields.map(({ key, name }) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 12, background: '#fafafa' }}
                      title={`${t('questions.option')} ${name + 1}`}
                      extra={
                        fields.length > 1 && (
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: 'red', fontSize: 18 }}
                          />
                        )
                      }
                    >
                      <Form.Item name={[name, 'text']} rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 12 }}>
                        <Input placeholder={t('questions.optionText')} />
                      </Form.Item>
                      <Form.Item name={[name, 'imageUrl']} style={{ marginBottom: 12 }}>
                        <ImageUploadButton />
                      </Form.Item>
                      <Form.Item name={[name, 'correct']} valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox>{t('questions.correct')}</Checkbox>
                      </Form.Item>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add({ text: '', correct: false })} icon={<PlusCircleOutlined />} block>
                    {t('questions.addOption')}
                  </Button>
                </>
              )}
            </Form.List>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" loading={loading} onClick={onSave}>
                {t('common.save')}
              </Button>
              <Button onClick={() => navigate('/teacher/questions')}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
