package com.carwash.service;

import com.carwash.dto.EmployeeRequest;
import com.carwash.dto.EmployeeResponse;
import com.carwash.model.Employee;
import com.carwash.model.Role;
import com.carwash.model.User;
import com.carwash.repository.EmployeeRepository;
import com.carwash.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (request.getEmail() != null && employeeRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Employee with email '" + request.getEmail() + "' already exists");
        }

        User linkedUser = null;
        if (request.isCreateLoginAccount()) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("User with email '" + request.getEmail() + "' already exists");
            }

            // Create system user credentials
            linkedUser = User.builder()
                    .email(request.getEmail())
                    .username(request.getEmail()) // use email as username
                    .fullName(request.getFirstName() + " " + request.getLastName())
                    .password(passwordEncoder.encode("Carwash@2024")) // temporary default password
                    .role(Role.valueOf(request.getRole() != null ? request.getRole() : "STAFF"))
                    .phone(request.getPhone())
                    .enabled(true)
                    .build();
            
            linkedUser = userRepository.save(linkedUser);
            log.info("System User created for Employee: {}", linkedUser.getEmail());
        }

        Employee employee = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .position(request.getPosition())
                .nationalId(request.getNationalId())
                .hireDate(request.getHireDate())
                .active(request.isActive())
                .user(linkedUser)
                .build();

        employee = employeeRepository.save(employee);
        log.info("Employee created: {}", employee.getFullName());
        return toResponse(employee);
    }

    public Page<EmployeeResponse> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable).map(this::toResponse);
    }

    public List<EmployeeResponse> getActiveEmployees() {
        return employeeRepository.findByActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EmployeeResponse getEmployeeById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = findById(id);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setPosition(request.getPosition());
        employee.setNationalId(request.getNationalId());
        employee.setHireDate(request.getHireDate());
        employee.setActive(request.isActive());
        employee = employeeRepository.save(employee);
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse toggleStatus(Long id, boolean active, java.time.LocalDateTime expectedReturnDate) {
        Employee employee = findById(id);
        if (employee.isActive() != active) {
            employee.setActive(active);
            employee.setStatusChangedAt(java.time.LocalDateTime.now());
            // When going active, clear the return date; when inactive, save it
            if (active) {
                employee.setExpectedReturnDate(null);
            } else {
                employee.setExpectedReturnDate(expectedReturnDate);
            }
            employee = employeeRepository.save(employee);
            log.info("Employee id={} status set to active={}, expectedReturn={}", id, active, expectedReturnDate);
        }
        return toResponse(employee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = findById(id);
        employeeRepository.delete(employee);
        log.info("Employee deleted: id={}", id);
    }

    public Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));
    }

    public EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .fullName(e.getFullName())
                .email(e.getEmail())
                .phone(e.getPhone())
                .position(e.getPosition())
                .nationalId(e.getNationalId())
                .hireDate(e.getHireDate())
                .active(e.isActive())
                .statusChangedAt(e.getStatusChangedAt())
                .expectedReturnDate(e.getExpectedReturnDate())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
