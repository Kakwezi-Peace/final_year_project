package com.carwash.controller;

import com.carwash.repository.BookingRepository;
import com.carwash.repository.CustomerRepository;
import com.carwash.model.BookingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // Uses a proper query from repository for scheduled washes today
        long todayCars = bookingRepository.findByScheduledAtBetween(todayStart, todayEnd).size();
        
        // Use repo method for revenue
        BigDecimal revenue = bookingRepository.totalRevenueBetween(todayStart, todayEnd);

        long pendingQueue = bookingRepository.countByStatus(BookingStatus.PENDING) + 
                            bookingRepository.countByStatus(BookingStatus.CONFIRMED);

        long totalCustomers = customerRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("todayCars", todayCars);
        stats.put("revenue", revenue != null ? revenue : BigDecimal.ZERO);
        stats.put("pending", pendingQueue);
        stats.put("customers", totalCustomers);

        return ResponseEntity.ok(stats);
    }
}
