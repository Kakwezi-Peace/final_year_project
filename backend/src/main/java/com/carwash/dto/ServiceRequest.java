package com.carwash.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceRequest {

    @NotBlank(message = "Service name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    private String category;  // Basic, Standard, Premium, Detailing

    private boolean active = true;
}
