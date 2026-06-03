package az.bsq.model.dto.request.user;

import az.bsq.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String username;
    @NotBlank
    @Email
    private String email;
    @NotBlank
    @Size(min = 6)
    private String password;
    private String fullName;
    @NotNull
    private Role role;
    private Long schoolId;
}
