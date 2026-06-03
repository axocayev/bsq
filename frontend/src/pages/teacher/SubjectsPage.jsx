import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getMySubjects } from '../../api/subjects';

const { Title } = Typography;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    getMySubjects().then(({ data }) => setSubjects(data)).finally(() => setLoading(false));
  }, []);

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: t('subjects.name'), dataIndex: 'name' },
    {
      title: t('common.status'), render: (_, r) =>
        r.inUse ? <Tag color="orange">{t('questions.inUse')}</Tag> : <Tag color="default">{t('subjects.free')}</Tag>,
    },
    { title: t('common.created'), dataIndex: 'createdAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 16 }}>{t('subjects.title')}</Title>
      <Input.Search
        placeholder={t('common.search')}
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table scroll={{ x: 'max-content' }} dataSource={filtered} columns={columns} rowKey="id" loading={loading} />
    </>
  );
}
