package az.bsq.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
// school fields removed — subjects are now global

@Data
@Builder
public class SubjectResponse {
    private Long id;
    private String name;
    private boolean inUse;
    private LocalDateTime createdAt;
}
