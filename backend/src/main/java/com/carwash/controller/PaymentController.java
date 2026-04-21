package com.carwash.controller;

import com.carwash.dto.PaymentRequest;
import com.carwash.dto.PaymentResponse;
import com.carwash.model.User;
import com.carwash.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing and tracking")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @Operation(summary = "Process a payment for a booking")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.processPayment(request));
    }

    @GetMapping
    @Operation(summary = "Get all payments (ADMIN/MANAGER/STAFF)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Page<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(paymentService.getAllPayments(q, pageable));
    }

    @GetMapping("/my-payments")
    @Operation(summary = "Get logged in user's payments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PaymentResponse>> getMyPayments(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(paymentService.getMyPayments(currentUser, q, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a payment by ID")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get payment for a booking")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentResponse> getPaymentByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentByBooking(bookingId));
    }

    /**
     * Step 1: Customer requests refund (auto-called on booking cancellation).
     * Can also be triggered manually for a specific booking.
     */
    @PostMapping("/booking/{bookingId}/request-refund")
    @Operation(summary = "Request refund for a cancelled booking")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> requestRefund(@PathVariable Long bookingId) {
        paymentService.requestRefund(bookingId);
        return ResponseEntity.ok().build();
    }

    /**
     * Step 2: Admin/Manager approves the refund — deducts 10% cancellation fee.
     */
    @PatchMapping("/{id}/refund")
    @Operation(summary = "Approve refund (ADMIN/MANAGER only). 10% cancellation fee is applied.")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<PaymentResponse> refundPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.refundPayment(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a payment record")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }
}
