package az.bsq.model.dto.request.user;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    @Email
    private String email;
    private String phone;
    private String password;
}
