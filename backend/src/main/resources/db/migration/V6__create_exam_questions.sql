CREATE TABLE exam_questions (
    exam_id         BIGINT  NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id     BIGINT  NOT NULL REFERENCES questions(id),
    display_order   INTEGER NOT NULL DEFAULT 0,
    points_override INTEGER,
    PRIMARY KEY (exam_id, question_id)
);

CREATE INDEX idx_exam_questions_exam_id     ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_question_id ON exam_questions(question_id);
