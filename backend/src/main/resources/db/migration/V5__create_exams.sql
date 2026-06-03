CREATE TABLE exams (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    duration_min INTEGER      NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    school_id    BIGINT       NOT NULL REFERENCES schools(id),
    created_by   BIGINT       NOT NULL REFERENCES users(id),
    start_date   TIMESTAMP,
    end_date     TIMESTAMP,
    is_shuffled  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exams_school_id  ON exams(school_id);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_status     ON exams(status);
