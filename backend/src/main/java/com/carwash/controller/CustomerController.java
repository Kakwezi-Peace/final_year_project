package com.carwash.controller;

import com.carwash.dto.CustomerRequest;
import com.carwash.dto.CustomerResponse;
import com.carwash.model.User;
import com.carwash.service.CustomerService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Customer management operations")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @Operation(summary = "Register a new customer")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
    }

    @GetMapping
    @Operation(summary = "Get all customers (paginated), or search by query param")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Page<CustomerResponse>> getCustomers(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(customerService.searchCustomers(q, pageable));
        }
        return ResponseEntity.ok(customerService.getAllCustomers(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a customer by ID")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer information")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a customer")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get the logged-in customer's own profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerResponse> getMyProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(customerService.getCustomerByUserId(currentUser.getId()));
    }

    @PostMapping("/me/request-deletion")
    @Operation(summary = "Customer requests their own account deletion")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> requestDeletion(@AuthenticationPrincipal User currentUser) {
        customerService.requestDeletionByUserId(currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me/request-deletion")
    @Operation(summary = "Customer cancels their pending deletion request")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> cancelDeletionRequest(@AuthenticationPrincipal User currentUser) {
        customerService.cancelDeletionRequestByUserId(currentUser.getId());
        return ResponseEntity.ok().build();
    }
}
