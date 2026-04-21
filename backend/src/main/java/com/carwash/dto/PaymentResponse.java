package com.carwash.dto;

import com.carwash.model.PaymentMethod;
import com.carwash.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private String bookingReference;
    private String customerName;
    private String transactionReference;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String mobileMoneyNumber;
    private String receiptNumber;
    private LocalDateTime paidAt;
    private String notes;
    private BigDecimal refundAmount;       // 90% of original (after 10% cancellation fee)
    private LocalDateTime refundedAt;
    private LocalDateTime createdAt;
}
