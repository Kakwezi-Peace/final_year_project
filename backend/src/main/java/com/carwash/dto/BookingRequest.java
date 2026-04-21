package com.carwash.dto;

import com.carwash.model.BookingStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingRequest {

    private Long customerId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    private List<Long> additionalServiceIds;

    private Long assignedEmployeeId;

    @NotNull(message = "Scheduled date/time is required")
    @Future(message = "Scheduled time must be in the future")
    private LocalDateTime scheduledAt;

    private String notes;

    // Payment Info
    private String paymentMethod;
    private String mobileMoneyNumber;
    private String stripeToken;
}
