package com.carwash.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String position;
    private String nationalId;
    private LocalDateTime hireDate;
    private boolean active;
    private LocalDateTime statusChangedAt;
    private LocalDateTime expectedReturnDate;
    private LocalDateTime createdAt;
}
