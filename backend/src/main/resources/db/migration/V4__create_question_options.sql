CREATE TABLE question_options (
    id            BIGSERIAL PRIMARY KEY,
    question_id   BIGINT      NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text          TEXT        NOT NULL,
    is_correct    BOOLEAN     NOT NULL DEFAULT FALSE,
    display_order INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);
