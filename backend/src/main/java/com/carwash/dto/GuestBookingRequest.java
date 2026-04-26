package com.carwash.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GuestBookingRequest {

    @NotBlank(message = "Guest name is required")
    private String guestName;

    @NotBlank(message = "Phone number is required")
    private String guestPhone;

    @NotBlank(message = "Vehicle plate is required")
    private String guestVehiclePlate;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotNull(message = "Scheduled date/time is required")
    @Future(message = "Scheduled time must be in the future")
    private LocalDateTime scheduledAt;

    private String notes;
}
