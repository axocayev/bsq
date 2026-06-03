package az.bsq.service.impl;

import az.bsq.dao.SchoolRepository;
import az.bsq.dao.UserRepository;
import az.bsq.exception.BsqException;
import az.bsq.model.dto.request.auth.LoginRequest;
import az.bsq.model.dto.response.AuthResponse;
import az.bsq.security.JwtTokenProvider;
import az.bsq.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            String token = tokenProvider.generateAccessToken(principal);

            var dbUser = userRepository.findByUsernameAndActiveTrue(principal.getUsername()).orElseThrow();

            String schoolName = null;
            if (principal.getSchoolId() != null) {
                schoolName = schoolRepository.findById(principal.getSchoolId())
                        .map(school -> school.getName())
                        .orElse(null);
            }

            return AuthResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .userId(principal.getId())
                    .username(principal.getUsername())
                    .fullName(dbUser.getFullName())
                    .role(dbUser.getRole())
                    .schoolId(principal.getSchoolId())
                    .schoolName(schoolName)
                    .build();
        } catch (BadCredentialsException e) {
            throw new BsqException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid username or password");
        }
    }
}
