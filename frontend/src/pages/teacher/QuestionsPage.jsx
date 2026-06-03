import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message,
  Tag, Typography, Checkbox, Row, Col, Upload, Image, Descriptions, Divider, Progress, Tooltip, Spin, Alert,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, PlusCircleOutlined, UploadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileImageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getMyQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../api/questions';
import { TYPE_KEYS, typeColor, typeLabel } from '../../utils/questionTypes';
import { getMySubjects } from '../../api/subjects';
import { uploadFile, compressImage } from '../../api/files';

const { Title } = Typography;

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
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
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload directly (no compression for speed)
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
    setUploading(true); // Show loading when file is selected
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

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // null = create mode, object = edit mode
  const [viewModal, setViewModal] = useState(null);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const filtered = questions.filter((q) =>
    [q.text, q.type].some((f) => String(f || '').toLowerCase().includes(search.toLowerCase()))
  );

  const load = () => {
    setLoading(true);
    getMyQuestions({ size: 100 }).then(({ data }) => setQuestions(data.content)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getMySubjects().then(({ data }) => setSubjects(data));
  }, []);

  const openCreate = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    form.setFieldsValue({
      text: q.text,
      subjectId: q.subjectId || undefined,
      type: q.type,
      explanation: q.explanation,
      imageUrl: q.imageUrl,
      options: q.options?.map((o) => ({ text: o.text, correct: o.correct, imageUrl: o.imageUrl, displayOrder: o.displayOrder })) || [],
    });
    setModalOpen(true);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, values);
        message.success(t('questions.questionUpdated'));
      } else {
        await createQuestion(values);
        message.success(t('questions.questionCreated'));
      }
      setModalOpen(false);
      load();
    } catch (e) { message.error(e.response?.data?.message || t('common.failed')); }
  };

  const needsOptions = type && type !== 'OPEN';

  const columns = [
    { title: t('questions.questionText'), dataIndex: 'text', ellipsis: true },
    {
      title: t('questions.image'), dataIndex: 'imageUrl', width: 70,
      render: (v) => v ? <Image src={v} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '—',
    },
    { title: t('subjects.name'), dataIndex: 'subjectName', render: (v) => v ? <Tag color="geekblue">{v}</Tag> : '—' },
    { title: t('questions.type'), dataIndex: 'type', render: (v) => <Tag color={typeColor[v]}>{typeLabel(v, t)}</Tag> },
    { title: t('questions.options'), dataIndex: 'options', render: (opts) => opts?.length || 0 },
    {
      title: t('common.actions'), render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewModal(r)}>{t('common.view')}</Button>
          {!r.inUse && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>{t('common.edit')}</Button>
          )}
          {!r.inUse ? (
            <Popconfirm title={t('questions.deleteConfirm')} onConfirm={() => deleteQuestion(r.id).then(() => { message.success(t('common.deleted')); load(); })}>
              <Button size="small" danger>{t('common.delete')}</Button>
            </Popconfirm>
          ) : (
            <Tag color="orange">{t('questions.inUse')}</Tag>
          )}
        </Space>
      )
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>{t('questions.title')}</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('questions.addQuestion')}
          </Button>
        </Col>
      </Row>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editingQuestion ? t('questions.editQuestion') : t('questions.createQuestion')} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} width={680}>
        <Form form={form} layout="vertical" initialValues={{ options: [{ text: '', correct: false }] }}>
          <Form.Item name="text" label={t('questions.questionText')} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
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
          <Form.Item name="type" label={t('questions.type')} rules={[{ required: true }]} style={{ minWidth: 200 }}>
            <Select options={TYPE_KEYS.map((tp) => ({ value: tp, label: typeLabel(tp, t) }))} />
          </Form.Item>
          <Form.Item name="explanation" label={t('questions.explanation')}>
            <Input.TextArea rows={2} />
          </Form.Item>

          {needsOptions && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('questions.options')}</div>
                  {fields.map(({ key, name }) => (
                    <Space key={key} align="start" style={{ display: 'flex', marginBottom: 12 }}>
                      <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 300 }}>
                        <Form.Item name={[name, 'text']} rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 0 }}>
                          <Input placeholder={t('questions.optionText')} />
                        </Form.Item>
                        <Form.Item name={[name, 'imageUrl']} style={{ marginBottom: 0 }}>
                          <ImageUploadButton />
                        </Form.Item>
                      </Space>
                      <Form.Item name={[name, 'correct']} valuePropName="checked" style={{ marginBottom: 0, marginTop: 4 }}>
                        <Checkbox>{t('questions.correct')}</Checkbox>
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', marginTop: 8 }} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ text: '', correct: false })} icon={<PlusCircleOutlined />} block>
                    {t('questions.addOption')}
                  </Button>
                </>
              )}
            </Form.List>
          )}
        </Form>
      </Modal>

      {/* View modal (read-only) */}
      <Modal
        title={<Space><EyeOutlined />{t('questions.viewQuestion')}</Space>}
        open={!!viewModal}
        onCancel={() => setViewModal(null)}
        footer={<Button onClick={() => setViewModal(null)}>{t('common.cancel')}</Button>}
        width={620}
      >
        {viewModal && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('questions.questionText')}>
                <span style={{ whiteSpace: 'pre-wrap' }}>{viewModal.text}</span>
              </Descriptions.Item>
              {viewModal.subjectName && (
                <Descriptions.Item label={t('subjects.name')}>
                  <Tag color="geekblue">{viewModal.subjectName}</Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('questions.type')}>
                <Tag color={typeColor[viewModal.type]}>{typeLabel(viewModal.type, t)}</Tag>
              </Descriptions.Item>
              {viewModal.explanation && (
                <Descriptions.Item label={t('questions.explanation')}>
                  {viewModal.explanation}
                </Descriptions.Item>
              )}
              {viewModal.imageUrl && (
                <Descriptions.Item label={t('questions.image')}>
                  <Image src={viewModal.imageUrl} style={{ maxHeight: 160, objectFit: 'contain', borderRadius: 4 }} />
                </Descriptions.Item>
              )}
            </Descriptions>

            {viewModal.options?.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }}>{t('questions.options')}</Divider>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {viewModal.options.map((o, i) => (
                    <div key={o.id ?? i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px', borderRadius: 6,
                      background: o.correct ? '#f6ffed' : '#fafafa',
                      border: `1px solid ${o.correct ? '#b7eb8f' : '#e8e8e8'}`,
                    }}>
                      {o.correct
                        ? <Tag color="success" style={{ minWidth: 24, textAlign: 'center' }}>✓</Tag>
                        : <Tag style={{ minWidth: 24, textAlign: 'center' }}>{i + 1}</Tag>}
                      <span style={{ flex: 1 }}>{o.text}</span>
                      {o.imageUrl && <Image src={o.imageUrl} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} />}
                    </div>
                  ))}
                </Space>
              </>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
