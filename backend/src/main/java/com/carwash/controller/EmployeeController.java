package com.carwash.controller;

import com.carwash.dto.EmployeeRequest;
import com.carwash.dto.EmployeeResponse;
import com.carwash.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Employee management operations")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @Operation(summary = "Create a new employee")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request));
    }

    @GetMapping
    @Operation(summary = "Get all employees (paginated)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Page<EmployeeResponse>> getAllEmployees(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(employeeService.getAllEmployees(pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active employees")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<EmployeeResponse>> getActiveEmployees() {
        return ResponseEntity.ok(employeeService.getActiveEmployees());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an employee by ID")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an employee")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle employee active/inactive status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<EmployeeResponse> toggleStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            @RequestParam(required = false) String returnDate) {
        java.time.LocalDateTime parsedReturnDate = null;
        if (returnDate != null && !returnDate.isBlank()) {
            parsedReturnDate = java.time.LocalDateTime.parse(returnDate);
        }
        return ResponseEntity.ok(employeeService.toggleStatus(id, active, parsedReturnDate));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an employee")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
