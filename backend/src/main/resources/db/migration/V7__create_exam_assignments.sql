CREATE TABLE exam_assignments (
    id           BIGSERIAL PRIMARY KEY,
    exam_id      BIGINT      NOT NULL REFERENCES exams(id),
    student_id   BIGINT      NOT NULL REFERENCES users(id),
    assigned_by  BIGINT      NOT NULL REFERENCES users(id),
    status       VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    started_at   TIMESTAMP,
    submitted_at TIMESTAMP,
    deadline     TIMESTAMP,
    auto_score   INTEGER,
    final_score  INTEGER,
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, student_id)
);

CREATE INDEX idx_exam_assignments_exam_id    ON exam_assignments(exam_id);
CREATE INDEX idx_exam_assignments_student_id ON exam_assignments(student_id);
CREATE INDEX idx_exam_assignments_status     ON exam_assignments(status);
