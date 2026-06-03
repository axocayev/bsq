package az.bsq.model.dto.response;

import az.bsq.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private Long schoolId;
    private String schoolName;
    private boolean active;
    private LocalDateTime createdAt;
}
