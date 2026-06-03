CREATE TABLE questions (
    id          BIGSERIAL PRIMARY KEY,
    text        TEXT         NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    points      INTEGER      NOT NULL DEFAULT 1,
    explanation TEXT,
    created_by  BIGINT       NOT NULL REFERENCES users(id),
    school_id   BIGINT       NOT NULL REFERENCES schools(id),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_school_id  ON questions(school_id);
CREATE INDEX idx_questions_created_by ON questions(created_by);
