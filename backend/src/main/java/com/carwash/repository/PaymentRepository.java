package com.carwash.repository;

import com.carwash.model.Payment;
import com.carwash.model.PaymentStatus;
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
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.customer c WHERE p.id = :id")
    Optional<Payment> findByIdWithDepth(@Param("id") Long id);

    @Query(value = "SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.customer c",
           countQuery = "SELECT count(p) FROM Payment p")
    Page<Payment> findAllWithDepth(Pageable pageable);

    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.customer c WHERE b.id = :bookingId")
    Optional<Payment> findByBookingIdWithDepth(@Param("bookingId") Long bookingId);

    @Query(value = "SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.customer c WHERE c.user.id = :userId",
           countQuery = "SELECT count(p) FROM Payment p JOIN p.booking b JOIN b.customer c WHERE c.user.id = :userId")
    Page<Payment> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b LEFT JOIN FETCH b.customer c " +
           "WHERE LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.receiptNumber) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR (c IS NOT NULL AND LOWER(c.firstName) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "OR (c IS NOT NULL AND LOWER(c.lastName) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Payment> searchPayments(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.customer c " +
           "WHERE c.user.id = :userId AND " +
           "(LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.receiptNumber) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Payment> searchMyPayments(@Param("userId") Long userId, @Param("q") String q, Pageable pageable);

    Optional<Payment> findByTransactionReference(String ref);
    List<Payment> findByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.status = 'PAID' AND p.paidAt BETWEEN :start AND :end")
    java.math.BigDecimal totalPaidBetween(@Param("start") LocalDateTime start,
                                @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.status = 'PAID' AND p.paymentMethod = :method")
    java.math.BigDecimal totalPaidByMethod(@Param("method") com.carwash.model.PaymentMethod method);
}
