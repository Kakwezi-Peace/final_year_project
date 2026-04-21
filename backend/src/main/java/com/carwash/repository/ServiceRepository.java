package com.carwash.repository;

import com.carwash.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByActiveTrue();
    List<Service> findByCategory(String category);
    List<Service> findByCategoryAndActiveTrue(String category);
    boolean existsByName(String name);
}
