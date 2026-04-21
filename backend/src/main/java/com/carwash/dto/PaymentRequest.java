package com.carwash.dto;

import com.carwash.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @jakarta.validation.constraints.Pattern(regexp = "^07[2389][0-9]{7}$", message = "Invalid Rwandan mobile number format")
    private String mobileMoneyNumber;
    private String stripeToken; // New: token from frontend for Stripe
    private String notes;
}
