-- Default any existing null overrides to 1 before constraining
UPDATE exam_questions SET points_override = 1 WHERE points_override IS NULL;

ALTER TABLE exam_questions
    ALTER COLUMN points_override SET NOT NULL,
    ALTER COLUMN points_override SET DEFAULT 1;

ALTER TABLE questions DROP COLUMN points;
