CREATE TABLE student_answer_options (
    student_answer_id BIGINT NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
    option_id         BIGINT NOT NULL REFERENCES question_options(id),
    PRIMARY KEY (student_answer_id, option_id)
);
