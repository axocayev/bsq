-- Replace auto-generated FK constraints with explicitly named ones.
-- RESTRICT = default NO ACTION, but now has a meaningful name for error messages.
-- Existing CASCADE constraints (question_options, exam_questions.exam_id,
-- student_answers.assignment_id, student_answer_options.answer_id) are left intact.

-- users → schools
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_school_id_fkey,
    ADD CONSTRAINT fk_user_school
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

-- questions → users (creator)
ALTER TABLE questions
    DROP CONSTRAINT IF EXISTS questions_created_by_fkey,
    ADD CONSTRAINT fk_question_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

-- questions → schools
ALTER TABLE questions
    DROP CONSTRAINT IF EXISTS questions_school_id_fkey,
    ADD CONSTRAINT fk_question_school
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

-- exams → schools
ALTER TABLE exams
    DROP CONSTRAINT IF EXISTS exams_school_id_fkey,
    ADD CONSTRAINT fk_exam_school
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

-- exams → users (creator)
ALTER TABLE exams
    DROP CONSTRAINT IF EXISTS exams_created_by_fkey,
    ADD CONSTRAINT fk_exam_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

-- exam_questions → questions  (RESTRICT: cannot delete question used in any exam)
ALTER TABLE exam_questions
    DROP CONSTRAINT IF EXISTS exam_questions_question_id_fkey,
    ADD CONSTRAINT fk_exam_question_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT;

-- exam_assignments → exams  (RESTRICT: cannot delete exam that has been assigned)
ALTER TABLE exam_assignments
    DROP CONSTRAINT IF EXISTS exam_assignments_exam_id_fkey,
    ADD CONSTRAINT fk_assignment_exam
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE RESTRICT;

-- exam_assignments → users (student)
ALTER TABLE exam_assignments
    DROP CONSTRAINT IF EXISTS exam_assignments_student_id_fkey,
    ADD CONSTRAINT fk_assignment_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;

-- exam_assignments → users (assigner)
ALTER TABLE exam_assignments
    DROP CONSTRAINT IF EXISTS exam_assignments_assigned_by_fkey,
    ADD CONSTRAINT fk_assignment_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT;

-- student_answers → questions  (RESTRICT: cannot delete question that has student answers)
ALTER TABLE student_answers
    DROP CONSTRAINT IF EXISTS student_answers_question_id_fkey,
    ADD CONSTRAINT fk_student_answer_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT;

-- student_answers → users (grader)  SET NULL: grader may be removed without losing answers
ALTER TABLE student_answers
    DROP CONSTRAINT IF EXISTS student_answers_graded_by_fkey,
    ADD CONSTRAINT fk_student_answer_grader
        FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL;

-- student_answer_options → question_options  (RESTRICT: cannot delete option used in answer)
ALTER TABLE student_answer_options
    DROP CONSTRAINT IF EXISTS student_answer_options_option_id_fkey,
    ADD CONSTRAINT fk_answer_option
        FOREIGN KEY (option_id) REFERENCES question_options(id) ON DELETE RESTRICT;
