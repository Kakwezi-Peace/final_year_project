package com.carwash.service;

import com.carwash.dto.VehicleRequest;
import com.carwash.dto.VehicleResponse;
import com.carwash.model.Customer;
import com.carwash.model.User;
import com.carwash.model.Vehicle;
import com.carwash.repository.CustomerRepository;
import com.carwash.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerService customerService;
    private final CustomerRepository customerRepository;

    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Vehicle with license plate '" + request.getLicensePlate() + "' already registered");
        }
        Customer customer = customerService.findById(request.getCustomerId());

        Vehicle vehicle = Vehicle.builder()
                .customer(customer)
                .licensePlate(request.getLicensePlate().toUpperCase())
                .make(request.getMake())
                .model(request.getModel())
                .year(request.getYear())
                .color(request.getColor())
                .vehicleType(request.getVehicleType())
                .build();

        vehicle = vehicleRepository.save(vehicle);
        log.info("Vehicle registered: {} for customer {}", vehicle.getLicensePlate(), customer.getFullName());
        return toResponse(vehicle);
    }


    @Transactional
    public VehicleResponse createVehicleForCustomerUser(VehicleRequest request, User currentUser) {
        Customer customer = customerRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new RuntimeException(
                    "No customer profile linked to your account. Please contact staff."));

        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            // If the plate already belongs to this customer, return the existing one
            Vehicle existing = vehicleRepository.findAll().stream()
                    .filter(v -> v.getLicensePlate().equalsIgnoreCase(request.getLicensePlate())
                              && v.getCustomer().getId().equals(customer.getId()))
                    .findFirst().orElse(null);
            if (existing != null) return toResponse(existing);
            throw new RuntimeException("Vehicle with license plate '" + request.getLicensePlate() + "' is already registered to another customer.");
        }

        Vehicle vehicle = Vehicle.builder()
                .customer(customer)
                .licensePlate(request.getLicensePlate().toUpperCase())
                .make(request.getMake() != null ? request.getMake() : "Not specified")
                .model(request.getModel() != null ? request.getModel() : "Not specified")
                .year(request.getYear())
                .color(request.getColor() != null ? request.getColor() : "Not specified")
                .vehicleType(request.getVehicleType())
                .build();

        vehicle = vehicleRepository.save(vehicle);
        log.info("Customer self-registered vehicle: {} (customer: {})", vehicle.getLicensePlate(), customer.getFullName());
        return toResponse(vehicle);
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehiclesByCustomer(Long customerId) {
        return vehicleRepository.findByCustomerId(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = findById(id);
        vehicle.setLicensePlate(request.getLicensePlate().toUpperCase());
        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setColor(request.getColor());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = findById(id);
        vehicleRepository.delete(vehicle);
        log.info("Vehicle deleted: id={}", id);
    }

    public Vehicle findById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + id));
    }

    public VehicleResponse toResponse(Vehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .customerId(v.getCustomer().getId())
                .customerName(v.getCustomer().getFullName())
                .licensePlate(v.getLicensePlate())
                .make(v.getMake())
                .model(v.getModel())
                .year(v.getYear())
                .color(v.getColor())
                .vehicleType(v.getVehicleType())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
