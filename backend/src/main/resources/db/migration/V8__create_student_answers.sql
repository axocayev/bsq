CREATE TABLE student_answers (
    id              BIGSERIAL PRIMARY KEY,
    assignment_id   BIGINT      NOT NULL REFERENCES exam_assignments(id) ON DELETE CASCADE,
    question_id     BIGINT      NOT NULL REFERENCES questions(id),
    answer_text     TEXT,
    is_correct      BOOLEAN,
    points_awarded  INTEGER,
    teacher_comment TEXT,
    graded_by       BIGINT REFERENCES users(id),
    graded_at       TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, question_id)
);

CREATE INDEX idx_student_answers_assignment_id ON student_answers(assignment_id);
CREATE INDEX idx_student_answers_question_id   ON student_answers(question_id);
