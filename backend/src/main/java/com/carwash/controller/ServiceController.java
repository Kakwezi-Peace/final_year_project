package com.carwash.controller;

import com.carwash.dto.ServiceRequest;
import com.carwash.dto.ServiceResponse;
import com.carwash.service.WashServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Tag(name = "Services", description = "Car wash service catalog")
public class ServiceController {

    private final WashServiceService washServiceService;

    @PostMapping
    @Operation(summary = "Create a new service")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ServiceResponse> createService(@Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(washServiceService.createService(request));
    }

    @GetMapping
    @Operation(summary = "Get all services (public)")
    public ResponseEntity<List<ServiceResponse>> getAllServices() {
        return ResponseEntity.ok(washServiceService.getAllServices());
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active services (public)")
    public ResponseEntity<List<ServiceResponse>> getActiveServices() {
        return ResponseEntity.ok(washServiceService.getActiveServices());
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get services by category (public)")
    public ResponseEntity<List<ServiceResponse>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(washServiceService.getServicesByCategory(category));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a service by ID (public)")
    public ResponseEntity<ServiceResponse> getService(@PathVariable Long id) {
        return ResponseEntity.ok(washServiceService.getServiceById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a service")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ServiceResponse> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(washServiceService.updateService(id, request));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle service active/inactive")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ServiceResponse> toggleService(@PathVariable Long id) {
        return ResponseEntity.ok(washServiceService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a service")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        washServiceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
