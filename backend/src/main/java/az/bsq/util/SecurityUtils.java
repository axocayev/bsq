package az.bsq.util;

import az.bsq.exception.BsqException;
import az.bsq.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("securityUtils")
public class SecurityUtils {

    public UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new BsqException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "No authenticated user");
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public Long getCurrentUserSchoolId() {
        return getCurrentUser().getSchoolId();
    }
}
