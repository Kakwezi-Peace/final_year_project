package com.carwash.dto;

import com.carwash.model.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String bookingReference;
    private Long customerId;
    private String customerName;
    private Long vehicleId;
    private String vehicleLicensePlate;
    private String vehicleMakeModel;
    private Long serviceId;
    private String serviceName;
    private String serviceCategory;
    private List<String> additionalServiceNames;
    private Long assignedEmployeeId;
    private String assignedEmployeeName;
    private BookingStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDateTime createdAt;
    private PaymentSummary payment;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentSummary {
        private Long paymentId;
        private String status;
        private String method;
        private BigDecimal amount;
    }
}
