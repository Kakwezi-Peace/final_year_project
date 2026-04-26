package com.carwash.service;

import com.carwash.dto.DashboardStats;
import com.carwash.model.BookingStatus;
import com.carwash.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final ServiceRepository serviceRepository;
    private final EmployeeRepository employeeRepository;
    private final PaymentRepository paymentRepository;

    public DashboardStats getDashboardStats() {
        LocalDateTime todayStart = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime todayEnd   = LocalDateTime.now().with(LocalTime.MAX);
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);

        long totalCustomers  = customerRepository.count();
        long totalBookings   = bookingRepository.count();
        long pendingBookings    = bookingRepository.countByStatus(BookingStatus.PENDING);
        long completedBookings  = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        long cancelledBookings  = bookingRepository.countByStatus(BookingStatus.CANCELLED);
        long inProgressBookings = bookingRepository.countByStatus(BookingStatus.IN_PROGRESS);

        java.time.LocalDateTime weekStart = LocalDateTime.now().with(java.time.DayOfWeek.MONDAY).with(LocalTime.MIN);
        
        BigDecimal totalRevenue = bookingRepository.totalRevenueBetween(monthStart, todayEnd);
        BigDecimal todayRevenue = paymentRepository.totalPaidBetween(todayStart, todayEnd);
        BigDecimal weeklyRevenue = paymentRepository.totalPaidBetween(weekStart, todayEnd);

        BigDecimal mtnRevenue = paymentRepository.totalPaidByMethodBetween(com.carwash.model.PaymentMethod.MTN_MOMO, weekStart, todayEnd);
        BigDecimal airtelRevenue = paymentRepository.totalPaidByMethodBetween(com.carwash.model.PaymentMethod.AIRTEL_MONEY, weekStart, todayEnd);

        long totalVehicles  = vehicleRepository.count();
        long totalServices  = serviceRepository.count();
        long totalEmployees = employeeRepository.count();
        long todayCars      = bookingRepository.countByCreatedAtBetween(todayStart, todayEnd);

        Map<String, Long> bookingsByStatus = Map.of(
            "PENDING",     pendingBookings,
            "CONFIRMED",   bookingRepository.countByStatus(BookingStatus.CONFIRMED),
            "IN_PROGRESS", inProgressBookings,
            "COMPLETED",   completedBookings,
            "CANCELLED",   cancelledBookings
        );

        return DashboardStats.builder()
                .totalCustomers(totalCustomers)
                .totalBookings(totalBookings)
                .todayCars(todayCars)
                .pendingBookings(pendingBookings)
                .completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings)
                .inProgressBookings(inProgressBookings)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .todayRevenue(todayRevenue)
                .mtnRevenue(mtnRevenue)
                .airtelRevenue(airtelRevenue)
                .weeklyRevenue(weeklyRevenue)
                .totalVehicles(totalVehicles)
                .totalServices(totalServices)
                .totalEmployees(totalEmployees)
                .bookingsByStatus(bookingsByStatus)
                .build();
    }

    public Map<String, Object> getRevenueReport(LocalDateTime start, LocalDateTime end) {
        BigDecimal totalRevenue = bookingRepository.totalRevenueBetween(start, end);
        long completedCount    = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        return Map.of(
            "startDate", start,
            "endDate",   end,
            "totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
            "completedBookings", completedCount
        );
    }

    public Map<Integer, Long> getDailyPeaks() {
        List<Object[]> results = bookingRepository.findBookingsPerHour();
        Map<Integer, Long> peaks = new java.util.HashMap<>();
        // Pre-fill with 0s for all business hours (e.g. 0-23 or just 7-20)
        for(int h=0; h<24; h++) peaks.put(h, 0L);
        
        for (Object[] res : results) {
            if (res[0] != null) {
                peaks.put(((Number)res[0]).intValue(), ((Number)res[1]).longValue());
            }
        }
        return peaks;
    }
}
