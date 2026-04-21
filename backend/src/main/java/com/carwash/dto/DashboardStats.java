package com.carwash.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalCustomers;
    private long totalBookings;
    private long todayCars;
    private long pendingBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long inProgressBookings;
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal mtnRevenue;
    private BigDecimal airtelRevenue;
    private BigDecimal weeklyRevenue;
    private long totalVehicles;
    private long totalServices;
    private long totalEmployees;
    private Map<String, Long> bookingsByStatus;
    private Map<String, BigDecimal> revenueByService;
}
