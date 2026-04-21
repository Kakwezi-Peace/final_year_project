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
public class VehicleResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String licensePlate;
    private String make;
    private String model;
    private Integer year;
    private String color;
    private String vehicleType;
    private LocalDateTime createdAt;
}
