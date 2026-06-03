package az.bsq.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ExamQuestionId implements Serializable {

    @Column(name = "exam_id")
    private Long examId;

    @Column(name = "question_id")
    private Long questionId;
}
