package com.carwash.repository;

import com.carwash.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByUserId(Long userId);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    @Query("SELECT DISTINCT c FROM Customer c LEFT JOIN c.vehicles v WHERE " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "c.phone LIKE CONCAT('%',:q,'%') OR " +
           "LOWER(v.licensePlate) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Customer> search(@Param("q") String query, Pageable pageable);
}
