package az.bsq.controller;

import az.bsq.model.dto.request.user.ChangePasswordRequest;
import az.bsq.model.dto.request.user.UpdateProfileRequest;
import az.bsq.model.dto.response.UserResponse;
import az.bsq.service.impl.UserServiceImpl;
import az.bsq.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/me")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class MeController {

    private final UserServiceImpl userService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public UserResponse getProfile() {
        return userService.findById(securityUtils.getCurrentUserId());
    }

    @PutMapping
    public UserResponse updateProfile(@RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(securityUtils.getCurrentUserId(), request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(securityUtils.getCurrentUserId(), request);
        return ResponseEntity.ok().build();
    }
}
