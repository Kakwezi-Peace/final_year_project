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
public class CustomerResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String nationalId;
    private String primaryVehiclePlate;
    private String primaryVehicleType;
    private LocalDateTime registeredAt;
    private int totalVehicles;
    private int totalBookings;
    private boolean deletionRequested;
    private LocalDateTime deletionRequestedAt;
}
