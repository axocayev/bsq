package az.bsq.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestion {

    @EmbeddedId
    private ExamQuestionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("examId")
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("questionId")
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "points_override", nullable = false)
    @Builder.Default
    private int pointsOverride = 1;

    public int effectivePoints() {
        return pointsOverride;
    }
}
