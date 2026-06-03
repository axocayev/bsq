package az.bsq.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SchoolResponse {
    private Long id;
    private String name;
    private String code;
    private boolean active;
    private LocalDateTime createdAt;
}
