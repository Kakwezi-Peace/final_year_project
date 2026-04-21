package com.carwash.controller;

import com.carwash.dto.AuthResponse;
import com.carwash.dto.LoginRequest;
import com.carwash.dto.RegisterRequest;
import com.carwash.model.Role;
import com.carwash.model.User;
import com.carwash.repository.CustomerRepository;
import com.carwash.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login, and profile")
public class AuthController {

    private final AuthService authService;
    private final CustomerRepository customerRepository;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account (CUSTOMER, STAFF, MANAGER, or ADMIN)")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username & password – returns JWT access + refresh token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user's profile")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id",       user.getId());
        response.put("username", user.getUsername());
        response.put("fullName", user.getFullName());
        response.put("email",    user.getEmail());
        response.put("phone",    user.getPhone() != null ? user.getPhone() : "");
        response.put("role",     user.getRole().name());

        // Include customer profile ID for CUSTOMER role so frontend can query their vehicles
        if (user.getRole() == Role.CUSTOMER) {
            customerRepository.findByUserId(user.getId())
                .ifPresent(c -> response.put("customerId", c.getId()));
        }

        return ResponseEntity.ok(response);
    }
}
