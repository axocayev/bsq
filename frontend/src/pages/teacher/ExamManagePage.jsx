import { useEffect, useState, useRef } from 'react';
import {
  Button, Form, Input, Space, message, Tag, Typography, Table, Modal,
  Alert, InputNumber, Divider,
} from 'antd';
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getExamQuestions, addQuestionsToExam, assignStudents,
  updateQuestionPoints, getExamById, getExamAssignments,
} from '../../api/exams';
import { getMyQuestions } from '../../api/questions';
import { typeColor, typeLabel } from '../../utils/questionTypes';
import { getTeacherStudents } from '../../api/users';

const { Title, Text } = Typography;

export default function ExamManagePage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { t } = useTranslation();

  const [exam, setExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [students, setStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);

  const [studentModal, setStudentModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const studentSearchTimeout = useRef(null);

  const totalMarks = Object.values(marksMap).reduce((s, v) => s + (Number(v) || 0), 0);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    try {
      const [examRes, eq, exAssignRes] = await Promise.all([
        getExamById(examId),
        getExamQuestions(examId),
        getExamAssignments(examId),
      ]);
      setExam(examRes.data);
      const questions = eq.data;
      setExamQuestions(questions);
      const initialMarks = {};
      questions.forEach((q) => { initialMarks[q.id] = q.points; });
      setMarksMap(initialMarks);

      const assignedIds = new Set(exAssignRes.data.map((a) => a.studentId));
      setAssignedStudents(exAssignRes.data.map((a) => ({ key: String(a.studentId), title: a.studentName })));
    } catch (error) {
      message.error(t('common.failed'));
      navigate('/teacher/exams');
    }
  };

  const loadStudents = (searchText) => {
    setStudentLoading(true);
    const params = { size: 200 };
    if (searchText) params.search = searchText;
    getTeacherStudents(params)
      .then(({ data }) => setAllStudents(data.content.map((x) => ({ key: String(x.id), title: x.fullName || x.username }))))
      .finally(() => setStudentLoading(false));
  };

  const openStudentModal = () => {
    setStudentSearch('');
    setSelectedStudentKeys([]);
    setStudentModal(true);
    loadStudents('');
  };

  const onStudentSearchChange = (e) => {
    const val = e.target.value;
    setStudentSearch(val);
    clearTimeout(studentSearchTimeout.current);
    studentSearchTimeout.current = setTimeout(() => loadStudents(val), 400);
  };

  const loadBankQuestions = (searchText) => {
    setBankLoading(true);
    const params = { size: 200, sort: 'createdAt,asc' };
    if (searchText) params.search = searchText;
    getMyQuestions(params)
      .then(({ data }) => setBankQuestions(data.content))
      .finally(() => setBankLoading(false));
  };

  const openQBankModal = () => {
    setBankSearch('');
    setSelectedBankKeys([]);
    setQBankModal(true);
    loadBankQuestions('');
  };

  const onBankSearchChange = (e) => {
    const val = e.target.value;
    setBankSearch(val);
    clearTimeout(bankSearchTimeout.current);
    bankSearchTimeout.current = setTimeout(() => loadBankQuestions(val), 400);
  };

  const onAddFromBank = async () => {
    if (!selectedBankKeys.length) return message.warning(t('questions.selectOneQuestion'));
    const existingIds = new Set(examQuestions.map((q) => q.id));
    const toAdd = selectedBankKeys.filter((id) => !existingIds.has(id));
    if (!toAdd.length) {
      message.info(t('exams.allAlreadyAdded'));
      setQBankModal(false);
      return;
    }
    try {
      await addQuestionsToExam(examId, { questionIds: toAdd });
      message.success(t('exams.questionsAdded'));
      setQBankModal(false);
      const { data } = await getExamQuestions(examId);
      setExamQuestions(data);
      const updatedMarks = { ...marksMap };
      data.forEach((q) => { if (updatedMarks[q.id] === undefined) updatedMarks[q.id] = q.points; });
      setMarksMap(updatedMarks);
    } catch {
      message.error(t('common.failed'));
    }
  };

  const onAddStudents = async () => {
    if (!selectedStudentKeys.length) return message.warning(t('exams.selectOneStudent'));
    const existingIds = new Set(assignedStudents.map((s) => s.key));
    const toAdd = selectedStudentKeys.filter((id) => !existingIds.has(id));
    if (!toAdd.length) {
      message.info(t('exams.allAlreadyAssigned'));
      setStudentModal(false);
      return;
    }
    try {
      await assignStudents(examId, { studentIds: toAdd.map(Number) });
      message.success(t('exams.studentsAssigned'));
      setStudentModal(false);
      setSelectedStudentKeys([]);
      const { data } = await getExamAssignments(examId);
      setAssignedStudents(data.map((a) => ({ key: String(a.studentId), title: a.studentName })));
    } catch {
      message.error(t('common.failed'));
    }
  };

  const onSaveMarks = async () => {
    if (totalMarks !== 100) {
      message.error(t('exams.totalMustBe100'));
      return;
    }
    setSavingMarks(true);
    try {
      await Promise.all(
        examQuestions.map((q) =>
          updateQuestionPoints(examId, q.id, { points: marksMap[q.id] ?? q.points })
        )
      );
      message.success(t('exams.marksSaved'));
      const { data } = await getExamQuestions(examId);
      setExamQuestions(data);
    } catch {
      message.error(t('common.failed'));
    } finally {
      setSavingMarks(false);
    }
  };

  const onAssignStudents = async () => {
    if (!selectedSKeys.length) return message.warning(t('exams.selectOneStudent'));
    try {
      await assignStudents(examId, { studentIds: selectedSKeys.map(Number) });
      message.success(t('exams.studentsAssigned'));
      setSelectedSKeys([]);
    } catch {
      message.error(t('common.failed'));
    }
  };

  const bankColumns = [
    { title: t('questions.questionText'), dataIndex: 'text', ellipsis: true },
    { title: t('questions.type'), dataIndex: 'type', width: 120, render: (v) => <Tag color={typeColor[v]}>{typeLabel(v, t)}</Tag> },
    { title: t('common.created'), dataIndex: 'createdAt', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—' },
  ];

  const examQuestionColumns = [
    { title: '#', render: (_, __, i) => i + 1, width: 40 },
    { title: t('questions.questionText'), dataIndex: 'text', ellipsis: true },
    { title: t('questions.type'), dataIndex: 'type', width: 120, render: (v) => <Tag color={typeColor[v]}>{typeLabel(v, t)}</Tag> },
    {
      title: t('exams.mark'),
      width: 100,
      render: (_, r) => (
        <InputNumber
          min={0}
          max={100}
          value={marksMap[r.id] ?? r.points}
          onChange={(val) => setMarksMap((prev) => ({ ...prev, [r.id]: val ?? 0 }))}
          style={{ width: 72 }}
          size="small"
          disabled={exam?.status !== 'DRAFT'}
        />
      ),
    },
  ];

  if (!exam) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Typography.Text>{t('common.loading')}</Typography.Text>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/teacher/exams')}
          style={{ marginBottom: 12 }}
        >
          {t('common.back')}
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {t('exams.manageTitle', { title: exam?.title })}
        </Title>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size="large">

        {/* Questions section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0 }}>
              {t('exams.questionsInExam', { count: examQuestions.length })}
            </Title>
            {['DRAFT', 'REJECTED'].includes(exam.status) && (
              <Button size="small" icon={<SearchOutlined />} onClick={openQBankModal}>
                {t('exams.addFromBank')}
              </Button>
            )}
          </div>

          {examQuestions.length === 0 ? (
            <Text type="secondary">{t('exams.noQuestionsYet')}</Text>
          ) : (
            <>
              <Table
                dataSource={examQuestions}
                columns={examQuestionColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />

              <div style={{ marginTop: 12 }}>
                {totalMarks !== 100 && (
                  <Alert
                    type="warning"
                    message={t('exams.totalMarkWarning', { total: totalMarks })}
                    style={{ marginBottom: 8 }}
                    showIcon
                  />
                )}
                {totalMarks === 100 && (
                  <Alert type="success" message={t('exams.totalMarksOk')} style={{ marginBottom: 8 }} showIcon />
                )}
                <Space align="center">
                  <Text type="secondary">{t('exams.totalMarks')}: <Text strong>{totalMarks}</Text> / 100</Text>
                  {['DRAFT', 'REJECTED'].includes(exam.status) && (
                    <Button
                      type="primary"
                      size="small"
                      loading={savingMarks}
                      onClick={onSaveMarks}
                    >
                      {t('exams.saveMarks')}
                    </Button>
                  )}
                </Space>
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* Assign students section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0 }}>
              {t('exams.assignStudents')} <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>({t('exams.assignBeforeSubmit')})</span>
            </Title>
            {['DRAFT', 'REJECTED'].includes(exam.status) && (
              <Button size="small" icon={<SearchOutlined />} onClick={openStudentModal}>
                {t('exams.addStudent')}
              </Button>
            )}
          </div>

          {assignedStudents.length === 0 ? (
            <Text type="secondary">{t('exams.noStudentsAssigned')}</Text>
          ) : (
            <Table
              dataSource={assignedStudents}
              rowKey="key"
              size="small"
              pagination={false}
              columns={[{ title: t('users.fullName'), dataIndex: 'title' }]}
            />
          )}
        </div>
      </Space>

      {/* Question bank modal */}
      <Modal
        title={t('exams.addFromBank')}
        open={qBankModal}
        onOk={onAddFromBank}
        onCancel={() => setQBankModal(false)}
        width={720}
        okText={t('exams.addSelectedQuestions')}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('common.search')}
          allowClear
          value={bankSearch}
          onChange={onBankSearchChange}
          style={{ marginBottom: 12 }}
        />
        <Table
          dataSource={bankQuestions}
          columns={bankColumns}
          rowKey="id"
          size="small"
          loading={bankLoading}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys: selectedBankKeys,
            onChange: (keys) => setSelectedBankKeys(keys),
          }}
        />
      </Modal>

      {/* Student modal */}
      <Modal
        title={t('exams.addStudent')}
        open={studentModal}
        onOk={onAddStudents}
        onCancel={() => setStudentModal(false)}
        width={720}
        okText={t('exams.addSelectedStudents')}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('common.search')}
          allowClear
          value={studentSearch}
          onChange={onStudentSearchChange}
          style={{ marginBottom: 12 }}
        />
        <Table
          dataSource={allStudents}
          columns={[{ title: t('users.fullName'), dataIndex: 'title', ellipsis: true }]}
          rowKey="key"
          size="small"
          loading={studentLoading}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys: selectedStudentKeys,
            onChange: (keys) => setSelectedStudentKeys(keys),
          }}
        />
      </Modal>
    </>
  );
}
