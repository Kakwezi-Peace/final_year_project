package com.carwash.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VehicleRequest {

    private Long customerId;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    private Integer year;
    private String color;
    private String vehicleType;
}
