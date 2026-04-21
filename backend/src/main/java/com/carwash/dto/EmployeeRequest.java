package com.carwash.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmployeeRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String position;
    private String nationalId;
    private LocalDateTime hireDate;
    private boolean active = true;

    // Onboarding options
    private boolean createLoginAccount = false;
    private String role; // ADMIN, MANAGER, STAFF
}
