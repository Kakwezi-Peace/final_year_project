package com.carwash.controller;

import com.carwash.dto.VehicleRequest;
import com.carwash.dto.VehicleResponse;
import com.carwash.service.VehicleService;
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
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicles", description = "Vehicle management operations")
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    @Operation(summary = "Register a new vehicle (ADMIN/MANAGER/STAFF only)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicle(request));
    }

    @GetMapping
    @Operation(summary = "Get all vehicles")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a vehicle by ID")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<VehicleResponse> getVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get all vehicles for a specific customer")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','CUSTOMER')")
    public ResponseEntity<List<VehicleResponse>> getVehiclesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByCustomer(customerId));
    }

    /**
     * Self-service endpoint: a CUSTOMER registers a vehicle linked to their own profile.
     * The customerId is resolved server-side from their JWT — no spoofing possible.
     */
    @PostMapping("/my-vehicle")
    @Operation(summary = "Customer self-registers a vehicle linked to their own profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<VehicleResponse> addMyVehicle(
            @Valid @RequestBody VehicleRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.carwash.model.User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.createVehicleForCustomerUser(request, currentUser));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update vehicle details")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a vehicle")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }
}
