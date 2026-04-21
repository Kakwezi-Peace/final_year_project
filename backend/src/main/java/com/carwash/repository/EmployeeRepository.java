package com.carwash.repository;

import com.carwash.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByActiveTrue();
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByUserId(Long userId);
    boolean existsByEmail(String email);
}
