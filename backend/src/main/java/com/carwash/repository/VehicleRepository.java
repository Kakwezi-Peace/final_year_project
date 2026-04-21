package com.carwash.repository;

import com.carwash.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByCustomerId(Long customerId);
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    boolean existsByLicensePlate(String licensePlate);
}
