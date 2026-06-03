import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Input, Space, Popconfirm, message,
  Tag, Typography, Row, Col, Image, Descriptions, Divider, Upload,
} from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, ImportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMyQuestions, deleteQuestion } from '../../api/questions';
import { typeColor, typeLabel } from '../../utils/questionTypes';

const { Title } = Typography;

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(null);
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
  }, []);

  const openCreate = () => {
    navigate('/teacher/questions/create');
  };

  const openEdit = (q) => {
    navigate(`/teacher/questions/${q.id}/edit`);
  };

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
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t('questions.addQuestion')}
            </Button>
            <Upload
              accept=".json,.csv"
              showUploadList={false}
              beforeUpload={(file) => {
                message.info(t('common.comingSoon'));
                return false;
              }}
            >
              <Button icon={<ImportOutlined />}>
                {t('questions.importFromFile')}
              </Button>
            </Upload>
          </Space>
        </Col>
      </Row>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />

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
