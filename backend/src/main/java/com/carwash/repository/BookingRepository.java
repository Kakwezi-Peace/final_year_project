package com.carwash.repository;

import com.carwash.model.Booking;
import com.carwash.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingReference(String ref);

    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByAssignedEmployeeId(Long employeeId);

    @Query("SELECT b FROM Booking b ORDER BY CASE b.status " +
           "WHEN 'IN_PROGRESS' THEN 1 " +
           "WHEN 'CONFIRMED' THEN 2 " +
           "WHEN 'PENDING' THEN 3 " +
           "WHEN 'COMPLETED' THEN 4 " +
           "ELSE 5 END ASC, b.scheduledAt ASC")
    Page<Booking> findAllQueueOrder(Pageable pageable);

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.scheduledAt BETWEEN :start AND :end")
    List<Booking> findByScheduledAtBetween(@Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(@Param("status") BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE " +
           "(LOWER(b.bookingReference) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(b.customer.firstName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(b.customer.lastName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(b.vehicle.licensePlate) LIKE LOWER(CONCAT('%',:q,'%'))) " +
           "ORDER BY CASE b.status " +
           "WHEN 'IN_PROGRESS' THEN 1 " +
           "WHEN 'CONFIRMED' THEN 2 " +
           "WHEN 'PENDING' THEN 3 " +
           "WHEN 'COMPLETED' THEN 4 " +
           "ELSE 5 END ASC, b.scheduledAt ASC")
    Page<Booking> searchQueueOrder(@Param("q") String query, Pageable pageable);

    // Revenue between date range
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b " +
           "WHERE b.status = 'COMPLETED' AND b.completedAt BETWEEN :start AND :end")
    java.math.BigDecimal totalRevenueBetween(@Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);

    @Query(value = "SELECT CAST(EXTRACT(HOUR FROM b.scheduled_at) AS INTEGER) as hr, COUNT(*) as cnt " +
                   "FROM bookings b " +
                   "GROUP BY hr " +
                   "ORDER BY hr", nativeQuery = true)
    List<Object[]> findBookingsPerHour();
}
