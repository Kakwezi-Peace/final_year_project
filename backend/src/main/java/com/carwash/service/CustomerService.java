package com.carwash.service;

import com.carwash.dto.CustomerRequest;
import com.carwash.dto.CustomerResponse;
import com.carwash.model.Customer;
import com.carwash.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final com.carwash.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (request.getEmail() != null && customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("A customer with email '" + request.getEmail() + "' already exists");
        }

        com.carwash.model.User user = com.carwash.model.User.builder()
                .username(request.getFirstName().toLowerCase() + System.currentTimeMillis() % 1000)
                .password(passwordEncoder.encode("password123")) // default password
                .fullName(request.getFirstName() + " " + request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(com.carwash.model.Role.CUSTOMER)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        Customer customer = Customer.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .nationalId(request.getNationalId())
                .build();

        customer = customerRepository.save(customer);
        log.info("Customer created: {}", customer.getFullName());
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable).map(this::toResponse);
    }


    @Transactional(readOnly = true)
    public Page<CustomerResponse> searchCustomers(String query, Pageable pageable) {
        return customerRepository.search(query, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = findById(id);
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = findById(id);
        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setNationalId(request.getNationalId());
        customer = customerRepository.save(customer);
        log.info("Customer updated: {}", customer.getFullName());
        return toResponse(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = findById(id);
        customerRepository.delete(customer);
        log.info("Customer deleted: id={}", id);
    }

    @Transactional
    public void requestDeletionByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Customer profile not found"));
        customer.setDeletionRequested(true);
        customer.setDeletionRequestedAt(java.time.LocalDateTime.now());
        customerRepository.save(customer);
        log.info("Deletion requested for customer id={}", customer.getId());
    }

    @Transactional
    public void cancelDeletionRequestByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Customer profile not found"));
        customer.setDeletionRequested(false);
        customer.setDeletionRequestedAt(null);
        customerRepository.save(customer);
        log.info("Deletion request cancelled for customer id={}", customer.getId());
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Customer profile not found"));
        return toResponse(customer);
    }

    public Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + id));
    }

    public CustomerResponse toResponse(Customer c) {
        String plate = "N/A";
        String type = "N/A";
        if (c.getVehicles() != null && !c.getVehicles().isEmpty()) {
            com.carwash.model.Vehicle primary = c.getVehicles().get(0);
            plate = primary.getLicensePlate();
            type = primary.getVehicleType();
        }

        return CustomerResponse.builder()
                .id(c.getId())
                .firstName(c.getFirstName())
                .lastName(c.getLastName())
                .fullName(c.getFullName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .nationalId(c.getNationalId())
                .primaryVehiclePlate(plate)
                .primaryVehicleType(type)
                .registeredAt(c.getRegisteredAt())
                .totalVehicles(c.getVehicles() != null ? c.getVehicles().size() : 0)
                .totalBookings(c.getBookings() != null ? c.getBookings().size() : 0)
                .deletionRequested(c.isDeletionRequested())
                .deletionRequestedAt(c.getDeletionRequestedAt())
                .build();
    }
}
