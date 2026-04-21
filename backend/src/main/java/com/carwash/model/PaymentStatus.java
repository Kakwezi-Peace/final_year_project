package com.carwash.model;

public enum PaymentStatus {
    PENDING,
    PAID,
    PARTIALLY_PAID,
    REFUND_REQUESTED,   // customer cancelled – awaiting admin approval
    REFUNDED,
    FAILED
}
