package com.carwash.service;

import com.carwash.dto.PaymentRequest;
import com.carwash.dto.PaymentResponse;
import com.carwash.model.*;
import com.carwash.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.model.Charge;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;
    private final NotificationService notificationService;

    public PaymentService(
            PaymentRepository paymentRepository,
            @org.springframework.context.annotation.Lazy BookingService bookingService,
            NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.bookingService = bookingService;
        this.notificationService = notificationService;
    }

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for booking: {} via {}", request.getBookingId(), request.getPaymentMethod());

        // Validate carrier prefixes
        String phone = request.getMobileMoneyNumber();
        if (request.getPaymentMethod() == PaymentMethod.MTN_MOMO) {
            if (phone == null || (!phone.startsWith("078") && !phone.startsWith("079"))) {
                throw new RuntimeException("wrong number!Try again (MTN requires 078 or 079)");
            }
        } else if (request.getPaymentMethod() == PaymentMethod.AIRTEL_MONEY) {
            if (phone == null || (!phone.startsWith("072") && !phone.startsWith("073"))) {
                throw new RuntimeException("wrong number!Try again (Airtel requires 072 or 073)");
            }
        }

        Booking booking = bookingService.findById(request.getBookingId());
        
        try {
            String txnRef = generateTransactionRef();
            
            // 1. GATEWAY INTEGRATION
            if (request.getPaymentMethod() == PaymentMethod.CARD) {
                processStripePayment(request, txnRef);
            } else if (request.getPaymentMethod() == PaymentMethod.MTN_MOMO || request.getPaymentMethod() == PaymentMethod.AIRTEL_MONEY) {
                processMobileMoneyPayment(request, txnRef);
            }

            // 2. SAVE PAYMENT RECORD
            Payment payment = Payment.builder()
                    .booking(booking)
                    .transactionReference(txnRef)
                    .amount(request.getAmount())
                    .paymentMethod(request.getPaymentMethod())
                    .status(PaymentStatus.PAID)
                    .mobileMoneyNumber(request.getMobileMoneyNumber())
                    .receiptNumber(generateReceiptNumber())
                    .paidAt(LocalDateTime.now())
                    .notes(request.getNotes())
                    .build();

            payment = paymentRepository.save(payment);

            // 3. NOTIFY SUCCESS
            notificationService.sendPaymentSuccess(phone, request.getAmount().toString(), txnRef);

            // AUTO-CONFIRM OR COMPLETE BOOKING
            if (booking.getStatus() == BookingStatus.IN_PROGRESS) {
                bookingService.updateStatus(booking.getId(), BookingStatus.COMPLETED);
            } else if (booking.getStatus() == BookingStatus.PENDING) {
                bookingService.updateStatus(booking.getId(), BookingStatus.CONFIRMED);
            }

            return toResponse(payment);

        } catch (Exception e) {
            log.error("Payment FAILED for booking {}: {}", booking.getBookingReference(), e.getMessage());
            notificationService.sendPaymentFailure(phone, e.getMessage());
            throw new RuntimeException("Payment Failed: " + e.getMessage());
        }
    }

    private void processStripePayment(PaymentRequest request, String ref) throws Exception {
        Map<String, Object> chargeParams = new HashMap<>();
        // Stripe expects amount in cents
        chargeParams.put("amount", request.getAmount().multiply(new java.math.BigDecimal(100)).intValue());
        chargeParams.put("currency", "rwf"); // Using RWF as base
        chargeParams.put("description", "Car Wash Booking: " + ref);
        chargeParams.put("source", request.getStripeToken());
        
        Charge.create(chargeParams);
        log.info("Stripe Charge Created for Ref: {}", ref);
    }

    private void processMobileMoneyPayment(PaymentRequest request, String ref) throws Exception {
        // SIMULATING MTN MOMO / AIRTEL API CALL
        log.info("Initiating Mobile Money Push for {} to {}", request.getPaymentMethod(), request.getMobileMoneyNumber());
        
        // Mock successful API response
        boolean apiSuccess = true; 
        if (!apiSuccess) throw new Exception("Mobile Money provider timeout");
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAllPayments(String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return paymentRepository.searchPayments(q, pageable).map(this::toResponse);
        }
        return paymentRepository.findAllWithDepth(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> getMyPayments(User currentUser, String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return paymentRepository.searchMyPayments(currentUser.getId(), q, pageable)
                    .map(this::toResponse);
        }
        return paymentRepository.findByUserId(currentUser.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findByIdWithDepth(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found with id: " + id));
        return toResponse(payment);
    }

    private String generateTransactionRef() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "TXN-" + ts;
    }

    private String generateReceiptNumber() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        long count = paymentRepository.count() + 1;
        return String.format("RCT-%s-%04d", ts, count);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByBooking(Long bookingId) {
        Payment payment = paymentRepository.findByBookingIdWithDepth(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("No payment found for booking id: " + bookingId));
        return toResponse(payment);
    }

    /**
     * Step 1 & 2 – called automatically when a customer or admin cancels a paid booking.
     * Automatically processes a 90% refund and retains a 10% fee.
     * Avoids REFUND_REQUESTED constraint failure.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void requestRefund(Long bookingId) {
        paymentRepository.findByBookingIdWithDepth(bookingId).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.PAID) {
                java.math.BigDecimal cancellationFee = payment.getAmount()
                        .multiply(new java.math.BigDecimal("0.10"))
                        .setScale(2, java.math.RoundingMode.HALF_UP);
                java.math.BigDecimal refundAmt = payment.getAmount().subtract(cancellationFee)
                        .setScale(2, java.math.RoundingMode.HALF_UP);

                payment.setStatus(PaymentStatus.REFUNDED);
                payment.setRefundAmount(refundAmt);
                payment.setRefundedAt(LocalDateTime.now());
                payment.setNotes((payment.getNotes() != null ? payment.getNotes() + " | " : "")
                        + String.format("Auto-Refunded via Cancellation: %.0f RWF returned (10%% fee: %.0f RWF)",
                                refundAmt, cancellationFee));
                paymentRepository.save(payment);
                log.info("Auto-refund issued for booking id={}: {} RWF", bookingId, refundAmt);
            }
        });
    }

    /**
     * Legacy manual refund trigger (safe-fail fallback)
     */
    @Transactional
    public PaymentResponse refundPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found with id: " + id));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new RuntimeException("This payment has already been refunded.");
        }

        // Deduct 10% cancellation fee — customer gets 90% back
        java.math.BigDecimal cancellationFee = payment.getAmount()
                .multiply(new java.math.BigDecimal("0.10"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal refundAmt = payment.getAmount().subtract(cancellationFee)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundAmount(refundAmt);
        payment.setRefundedAt(LocalDateTime.now());
        payment.setNotes((payment.getNotes() != null ? payment.getNotes() + " | " : "")
                + String.format("Refund approved: %.0f RWF returned (10%% fee: %.0f RWF)",
                        refundAmt, cancellationFee));
        payment = paymentRepository.save(payment);
        log.info("Payment id={} refunded: {} RWF (fee kept: {} RWF)", id, refundAmt, cancellationFee);
        return toResponse(payment);
    }

    @Transactional
    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found with id: " + id));
        paymentRepository.delete(payment);
        log.info("Payment deleted: id={}", id);
    }

    public PaymentResponse toResponse(Payment p) {
        String customerName = p.getBooking().getCustomer() != null
            ? p.getBooking().getCustomer().getFullName()
            : "Walk-in";

        return PaymentResponse.builder()
                .id(p.getId())
                .bookingId(p.getBooking().getId())
                .bookingReference(p.getBooking().getBookingReference())
                .customerName(customerName)
                .transactionReference(p.getTransactionReference())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .status(p.getStatus())
                .mobileMoneyNumber(p.getMobileMoneyNumber())
                .receiptNumber(p.getReceiptNumber())
                .paidAt(p.getPaidAt())
                .notes(p.getNotes())
                .refundAmount(p.getRefundAmount())
                .refundedAt(p.getRefundedAt())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
