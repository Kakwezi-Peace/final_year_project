package com.carwash.controller;

import com.carwash.dto.BookingRequest;
import com.carwash.dto.BookingResponse;
import com.carwash.model.BookingStatus;
import com.carwash.model.User;
import com.carwash.service.BookingService;
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

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Booking & scheduling – create, track, cancel")
public class BookingController {

    private final BookingService bookingService;


    // CREATE


    @PostMapping
    @Operation(summary = "Create a new booking")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, currentUser));
    }


    // READ

    @GetMapping
    @Operation(summary = "List all bookings (ADMIN/STAFF) or own bookings (CUSTOMER)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllBookings(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal User currentUser) {

        // Customers only see their own bookings
        if (currentUser.getRole().name().equals("CUSTOMER")) {
            return ResponseEntity.ok(bookingService.getBookingsByCurrentUser(currentUser, pageable));
        }
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(bookingService.searchBookings(q, pageable));
        }
        return ResponseEntity.ok(bookingService.getAllBookings(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a booking by ID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookingService.getBookingById(id, currentUser));
    }

    @GetMapping("/reference/{ref}")
    @Operation(summary = "Look up a booking by its reference code (e.g. CW-20240319-0001)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBookingByRef(
            @PathVariable String ref,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookingService.getBookingByReference(ref, currentUser));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get all bookings for a specific customer (ADMIN/STAFF)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingResponse>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(customerId));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get bookings assigned to an employee (ADMIN/STAFF)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingResponse>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(bookingService.getBookingsByEmployee(employeeId));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Filter bookings by status (ADMIN/STAFF)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingResponse>> getByStatus(@PathVariable BookingStatus status) {
        return ResponseEntity.ok(bookingService.getBookingsByStatus(status));
    }

    @GetMapping("/my-bookings")
    @Operation(summary = "Get the logged-in customer's own bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal User currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(bookingService.getBookingsByCurrentUser(currentUser, pageable));
    }


    // UPDATE

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update booking status – ADMIN/STAFF only (PENDING→CONFIRMED→IN_PROGRESS→COMPLETED)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a booking – CUSTOMER can cancel their own; ADMIN/STAFF can cancel any")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false, defaultValue = "Cancelled by customer") String reason) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, currentUser, reason));
    }

    @PatchMapping("/{id}/assign-employee/{employeeId}")
    @Operation(summary = "Assign an employee to a booking (ADMIN/STAFF)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<BookingResponse> assignEmployee(
            @PathVariable Long id,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(bookingService.assignEmployee(id, employeeId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update booking details – scheduled time, notes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> updateBooking(
            @PathVariable Long id,
            @RequestBody BookingRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request, currentUser));
    }


    // DELETE


    @DeleteMapping("/{id}")
    @Operation(summary = "Hard-delete a booking record (ADMIN only)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
