package com.carwash.service;

import com.carwash.dto.*;
import com.carwash.model.Role;
import com.carwash.model.User;
import com.carwash.repository.UserRepository;
import com.carwash.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final com.carwash.repository.CustomerRepository customerRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().toLowerCase();
        String email = request.getEmail().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username '" + username + "' is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email '" + email + "' is already registered");
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(email)
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : Role.CUSTOMER)
                .enabled(true)
                .build();

        userRepository.save(user);
        
        if (user.getRole() == Role.CUSTOMER) {
            String[] nameParts = user.getFullName().split(" ", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "";
            
            com.carwash.model.Customer customer = com.carwash.model.Customer.builder()
                    .user(user)
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .address(request.getAddress())
                    .nationalId(request.getNationalId())
                    .build();
            customerRepository.save(customer);
        }
        
        log.info("New user registered: {} with role {}", user.getUsername(), user.getRole());

        String accessToken = jwtTokenProvider.generateToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsernameOrEmail(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = jwtTokenProvider.generateToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        log.info("User logged in: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .build();
    }
}
