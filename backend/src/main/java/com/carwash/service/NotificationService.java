package com.carwash.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private JavaMailSender mailSender;


     // Sends a payment success notification via Email and SMS

    public void sendPaymentSuccess(String email, String phone, String amount, String ref) {
        String message = "Rubis Car Wash: Payment of " + amount + " RWF received successfully. Ref: " + ref + ". Thank you!";
        
        // 1. Send SMS (Simulated)
        sendSMS(phone, message);

        // 2. Send Email
        if (email != null && !email.isBlank()) {
            sendEmail(email, "Payment Confirmed - Rubis Car Wash", 
                "Dear Customer,\n\nYour payment of " + amount + " RWF has been confirmed.\n" +
                "Transaction Reference: " + ref + "\n\nThank you for choosing Rubis.");
        }
    }

    // Compatibility helper
    public void sendPaymentSuccess(String phone, String amount, String ref) {
        sendPaymentSuccess(null, phone, amount, ref);
    }


     // Sends a payment failure notification

    public void sendPaymentFailure(String phone, String error) {
        log.warn(" SMS SENT TO {}: Payment failed. Reason: {}", phone, error);
        sendSMS(phone, "Rubis Car Wash: Payment failed. Reason: " + error);
    }


     // Sends a booking cancellation notification

    public void sendBookingCancelled(String email, String phone, String ref, String reason) {
        String message = "Rubis Car Wash: Your booking " + ref + " has been cancelled. Reason: " + reason;
        
        // 1. Send SMS (Simulated)
        sendSMS(phone, message);

        // 2. Send Email
        if (email != null && !email.isBlank()) {
            sendEmail(email, "Booking Cancelled - Rubis Car Wash", 
                "Dear Customer,\n\nWe regret to inform you that your booking (" + ref + ") has been cancelled.\n" +
                "Reason: " + reason + "\n\nIf you have questions, please visit our station.");
        }
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("notifications@rubisrwanda.rw");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            if (mailSender != null) {
                mailSender.send(message);
                log.info(" EMAIL SENT TO {}: [{}] {}", to, subject, body);
            } else {
                log.info(" [DRY-RUN] EMAIL CONTENT FOR {}: [{}] {}", to, subject, body);
                log.warn("Email was not physically sent because JavaMailSender is not configured.");
            }
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private void sendSMS(String phone, String message) {
        String provider = "Unknown";
        if (phone.startsWith("078") || phone.startsWith("079") || phone.startsWith("25078") || phone.startsWith("25079")) {
            provider = "MTN MOMO GATEWAY";
        } else if (phone.startsWith("072") || phone.startsWith("073") || phone.startsWith("25072") || phone.startsWith("25073")) {
            provider = "AIRTEL MONEY GATEWAY";
        }

        log.info("📱 [{} >> {}]: {}", provider, phone, message);
    }
}
