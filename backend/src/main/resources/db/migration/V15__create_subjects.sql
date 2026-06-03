CREATE TABLE subjects (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    school_id  BIGINT       NOT NULL REFERENCES schools(id),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_school_id ON subjects(school_id);

ALTER TABLE questions ADD COLUMN subject_id BIGINT REFERENCES subjects(id);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
