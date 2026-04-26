package com.carwash.service;

import com.carwash.dto.BookingRequest;
import com.carwash.dto.BookingResponse;
import com.carwash.dto.GuestBookingRequest;
import com.carwash.model.*;
import com.carwash.repository.BookingRepository;
import com.carwash.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerService customerService;
    private final VehicleService vehicleService;
    private final WashServiceService washServiceService;
    private final EmployeeService employeeService;
    private final CustomerRepository customerRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    public BookingService(
            BookingRepository bookingRepository,
            CustomerService customerService,
            VehicleService vehicleService,
            WashServiceService washServiceService,
            EmployeeService employeeService,
            CustomerRepository customerRepository,
            @org.springframework.context.annotation.Lazy PaymentService paymentService,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.customerService = customerService;
        this.vehicleService = vehicleService;
        this.washServiceService = washServiceService;
        this.employeeService = employeeService;
        this.customerRepository = customerRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }


    // CREATE


    @Transactional
    public BookingResponse createBooking(BookingRequest request, User currentUser) {
        Customer customer;

        // If the caller is a CUSTOMER, force their customer record
        if (currentUser.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException(
                        "No customer profile linked to your account. Contact staff to register your profile."));
        } else {
            customer = customerService.findById(request.getCustomerId());
        }

        Vehicle vehicle = vehicleService.findById(request.getVehicleId());

        // Customer can only book their own vehicles
        if (currentUser.getRole() == Role.CUSTOMER &&
            !vehicle.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("You can only book your own vehicles");
        }

        com.carwash.model.Service service = washServiceService.findById(request.getServiceId());
        
        List<com.carwash.model.Service> additionalServices = new java.util.ArrayList<>();
        java.math.BigDecimal totalAmount = service.getPrice();
        
        if (request.getAdditionalServiceIds() != null) {
            for (Long addId : request.getAdditionalServiceIds()) {
                com.carwash.model.Service addSvc = washServiceService.findById(addId);
                additionalServices.add(addSvc);
                totalAmount = totalAmount.add(addSvc.getPrice());
            }
        }

        Employee employee = null;
        if (request.getAssignedEmployeeId() != null) {
            employee = employeeService.findById(request.getAssignedEmployeeId());
            if (!employee.isActive()) {
                throw new RuntimeException("Cannot assign an inactive employee to a booking.");
            }
        }

        String ref = generateReference();

        Booking booking = Booking.builder()
                .bookingReference(ref)
                .customer(customer)
                .vehicle(vehicle)
                .service(service)
                .additionalServices(additionalServices)
                .assignedEmployee(employee)
                .status(BookingStatus.PENDING)
                .scheduledAt(request.getScheduledAt())
                .totalAmount(totalAmount)
                .notes(request.getNotes())
                .build();

        booking = bookingRepository.save(booking);

        // Process payment if provided
        if (request.getPaymentMethod() != null) {
            try {
                com.carwash.dto.PaymentRequest paymentRequest = new com.carwash.dto.PaymentRequest();
                paymentRequest.setBookingId(booking.getId());
                paymentRequest.setAmount(totalAmount);
                paymentRequest.setPaymentMethod(com.carwash.model.PaymentMethod.valueOf(request.getPaymentMethod()));
                paymentRequest.setMobileMoneyNumber(request.getMobileMoneyNumber());
                paymentRequest.setStripeToken(request.getStripeToken());
                paymentRequest.setNotes("Payment for booking " + ref);
                
                paymentService.processPayment(paymentRequest);
                // If payment is successful, we can update status to CONFIRMED
                booking.setStatus(BookingStatus.CONFIRMED);
                bookingRepository.save(booking);
            } catch (Exception e) {
                log.error("Payment failed for booking {}: {}", ref, e.getMessage());
                // Keep it pending, user can pay later from dashboard
            }
        }

        log.info("Booking created: {} for customer '{}'", ref, customer.getFullName());
        return toResponse(booking);
    }


    // CREATE GUEST BOOKING (no login required)


    @Transactional
    public BookingResponse createGuestBooking(GuestBookingRequest request) {
        com.carwash.model.Service service = washServiceService.findById(request.getServiceId());
        java.math.BigDecimal totalAmount = service.getPrice();

        String ref = generateReference();

        Booking booking = Booking.builder()
                .bookingReference(ref)
                .customer(null)          // No customer record for guests
                .vehicle(null)           // No vehicle record for guests
                .service(service)
                .additionalServices(new java.util.ArrayList<>())
                .assignedEmployee(null)
                .status(BookingStatus.PENDING)
                .scheduledAt(request.getScheduledAt())
                .totalAmount(totalAmount)
                .notes(request.getNotes())
                .isGuest(true)
                .guestName(request.getGuestName())
                .guestPhone(request.getGuestPhone())
                .guestVehiclePlate(request.getGuestVehiclePlate())
                .build();

        booking = bookingRepository.save(booking);
        log.info("Guest booking created: {} for guest '{}'", ref, request.getGuestName());
        return toResponse(booking);
    }


    // READ


    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Pageable pageable) {
        return bookingRepository.findAllQueueOrder(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> searchBookings(String query, Pageable pageable) {
        return bookingRepository.searchQueueOrder(query, pageable).map(this::toResponse);
    }

    /** Get a booking by ID, enforcing ownership for CUSTOMER role */
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, User currentUser) {
        Booking booking = findById(id);
        assertCanAccess(booking, currentUser);
        return toResponse(booking);
    }

    /** Get by reference, enforcing ownership */
    @Transactional(readOnly = true)
    public BookingResponse getBookingByReference(String ref, User currentUser) {
        Booking booking = bookingRepository.findByBookingReference(ref)
                .orElseThrow(() -> new EntityNotFoundException(
                    "Booking not found with reference: " + ref));
        assertCanAccess(booking, currentUser);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Returns bookings belonging to the currently logged-in customer */
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByCurrentUser(User currentUser, Pageable pageable) {
        Customer customer = customerRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new RuntimeException(
                    "No customer profile found for your account"));
        return bookingRepository.findByCustomerId(customer.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByEmployee(Long employeeId) {
        return bookingRepository.findByAssignedEmployeeId(employeeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // UPDATE – STATUS

    @Transactional
    public BookingResponse updateStatus(Long id, BookingStatus newStatus) {
        Booking booking = findById(id);
        validateStatusTransition(booking.getStatus(), newStatus);
        booking.setStatus(newStatus);
        if (newStatus == BookingStatus.IN_PROGRESS) {
            booking.setStartedAt(LocalDateTime.now());
        } else if (newStatus == BookingStatus.COMPLETED) {
            booking.setCompletedAt(LocalDateTime.now());
        }
        booking = bookingRepository.save(booking);
        log.info("Booking {} → status changed to {}", booking.getBookingReference(), newStatus);
        return toResponse(booking);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CANCEL – CUSTOMER can cancel their own; ADMIN/STAFF can cancel any
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public BookingResponse cancelBooking(Long id, User currentUser, String reason) {
        Booking booking = findById(id);

        // Ownership check for CUSTOMER
        if (currentUser.getRole() == Role.CUSTOMER) {
            assertCanAccess(booking, currentUser);
        }

        // Business rule: cannot cancel a completed or already-cancelled booking
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a booking that has already been completed");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }
        // Customers can only cancel PENDING bookings (not IN_PROGRESS)
        if (currentUser.getRole() == Role.CUSTOMER &&
            booking.getStatus() == BookingStatus.IN_PROGRESS) {
            throw new RuntimeException("Cannot cancel a booking that is already in progress. Please contact staff.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setNotes((booking.getNotes() != null ? booking.getNotes() + " | " : "")
                + "Cancellation reason: " + reason
                + " [cancelled by " + currentUser.getUsername() + "]");
        booking = bookingRepository.save(booking);

        // --- AUTO FLAG PAYMENT FOR REFUND if customer paid ---
        try {
            paymentService.requestRefund(booking.getId());
        } catch (Exception e) {
            log.warn("Could not flag payment for refund on booking {}: {}", booking.getBookingReference(), e.getMessage());
        }
        
        // --- SEND NOTIFICATION ---
        try {
            String email = booking.getCustomer().getUser().getEmail();
            String phone = booking.getCustomer().getPhone();
            notificationService.sendBookingCancelled(email, phone, booking.getBookingReference(), reason);
        } catch (Exception e) {
            log.warn("Could not send cancellation notification for {}: {}", booking.getBookingReference(), e.getMessage());
        }

        log.info("Booking {} cancelled by {} – reason: {}", booking.getBookingReference(),
                currentUser.getUsername(), reason);
        return toResponse(booking);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE – GENERAL
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public BookingResponse assignEmployee(Long bookingId, Long employeeId) {
        Booking booking = findById(bookingId);
        Employee employee = employeeService.findById(employeeId);
        if (!employee.isActive()) {
            throw new RuntimeException("Cannot assign an inactive employee to a booking.");
        }
        booking.setAssignedEmployee(employee);
        booking = bookingRepository.save(booking);
        log.info("Employee '{}' assigned to booking {}", employee.getFullName(), booking.getBookingReference());
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse unassignEmployee(Long bookingId) {
        Booking booking = findById(bookingId);
        booking.setAssignedEmployee(null);
        booking = bookingRepository.save(booking);
        log.info("Employee unassigned from booking {}", booking.getBookingReference());
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request, User currentUser) {
        Booking booking = findById(id);
        assertCanAccess(booking, currentUser);

        if (booking.getStatus() == BookingStatus.COMPLETED ||
            booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot update a " + booking.getStatus() + " booking");
        }

        if (request.getScheduledAt() != null) booking.setScheduledAt(request.getScheduledAt());
        if (request.getNotes() != null)       booking.setNotes(request.getNotes());
        
        if (request.getServiceId() != null) {
            com.carwash.model.Service service = washServiceService.findById(request.getServiceId());
            booking.setService(service);
            
            List<com.carwash.model.Service> additionalServices = new java.util.ArrayList<>();
            java.math.BigDecimal totalAmount = service.getPrice();
            
            if (request.getAdditionalServiceIds() != null) {
                for (Long addId : request.getAdditionalServiceIds()) {
                    com.carwash.model.Service addSvc = washServiceService.findById(addId);
                    additionalServices.add(addSvc);
                    totalAmount = totalAmount.add(addSvc.getPrice());
                }
            }
            booking.setAdditionalServices(additionalServices);
            booking.setTotalAmount(totalAmount);
        }
        
        // Only internal staff can change assigned employee
        if (request.getAssignedEmployeeId() != null && currentUser.getRole() != Role.CUSTOMER) {
            Employee employee = employeeService.findById(request.getAssignedEmployeeId());
            if (!employee.isActive()) {
                throw new RuntimeException("Cannot assign an inactive employee to a booking.");
            }
            booking.setAssignedEmployee(employee);
        }
        
        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = findById(id);
        bookingRepository.delete(booking);
        log.info("Booking hard-deleted: id={}", id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    public Booking findById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found with id: " + id));
    }

    /**
     * A CUSTOMER may only access bookings that belong to their linked customer record.
     * ADMIN and STAFF may access any booking.
     */
    private void assertCanAccess(Booking booking, User currentUser) {
        if (currentUser.getRole() == Role.CUSTOMER) {
            Customer customer = customerRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("No customer profile for your account"));
            if (!booking.getCustomer().getId().equals(customer.getId())) {
                throw new AccessDeniedException("You are not authorized to access this booking");
            }
        }
    }

    /**
     * Enforce valid status transitions to prevent illegal state changes.
     */
    private void validateStatusTransition(BookingStatus current, BookingStatus next) {
        boolean valid = switch (current) {
            case PENDING     -> next == BookingStatus.CONFIRMED   || next == BookingStatus.IN_PROGRESS || next == BookingStatus.CANCELLED;
            case CONFIRMED   -> next == BookingStatus.IN_PROGRESS || next == BookingStatus.CANCELLED;
            case IN_PROGRESS -> next == BookingStatus.COMPLETED   || next == BookingStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new RuntimeException(
                "Invalid status transition: " + current + " → " + next);
        }
    }

    private String generateReference() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return String.format("CW-%s-%s", datePart, randomPart);
    }

    public BookingResponse toResponse(Booking b) {
        BookingResponse.PaymentSummary paymentSummary = null;
        if (b.getPayment() != null) {
            Payment p = b.getPayment();
            paymentSummary = BookingResponse.PaymentSummary.builder()
                    .paymentId(p.getId())
                    .status(p.getStatus().name())
                    .method(p.getPaymentMethod().name())
                    .amount(p.getAmount())
                    .build();
        }

        // Safely resolve customer/vehicle (null for guest bookings)
        Long customerId = b.isGuest() ? null : (b.getCustomer() != null ? b.getCustomer().getId() : null);
        String customerName = b.isGuest() ? (b.getGuestName() + " (Guest)") : (b.getCustomer() != null ? b.getCustomer().getFullName() : "Unknown");
        Long vehicleId = b.isGuest() ? null : (b.getVehicle() != null ? b.getVehicle().getId() : null);
        String vehiclePlate = b.isGuest() ? b.getGuestVehiclePlate() : (b.getVehicle() != null ? b.getVehicle().getLicensePlate() : "");
        String vehicleMakeModel = b.isGuest() ? "Guest Vehicle" : (b.getVehicle() != null ? b.getVehicle().getMake() + " " + b.getVehicle().getModel() : "");

        return BookingResponse.builder()
                .id(b.getId())
                .bookingReference(b.getBookingReference())
                .customerId(customerId)
                .customerName(customerName)
                .vehicleId(vehicleId)
                .vehicleLicensePlate(vehiclePlate)
                .vehicleMakeModel(vehicleMakeModel)
                .serviceId(b.getService().getId())
                .serviceName(b.getService().getName())
                .serviceCategory(b.getService().getCategory())
                .additionalServiceNames(b.getAdditionalServices() != null ? b.getAdditionalServices().stream().map(com.carwash.model.Service::getName).collect(Collectors.toList()) : new java.util.ArrayList<>())
                .assignedEmployeeId(b.getAssignedEmployee() != null ? b.getAssignedEmployee().getId() : null)
                .assignedEmployeeName(b.getAssignedEmployee() != null ? b.getAssignedEmployee().getFullName() : null)
                .status(b.getStatus())
                .scheduledAt(b.getScheduledAt())
                .startedAt(b.getStartedAt())
                .completedAt(b.getCompletedAt())
                .totalAmount(b.getTotalAmount())
                .notes(b.getNotes())
                .createdAt(b.getCreatedAt())
                .payment(paymentSummary)
                .isGuest(b.isGuest())
                .guestName(b.getGuestName())
                .guestPhone(b.getGuestPhone())
                .guestVehiclePlate(b.getGuestVehiclePlate())
                .build();
    }
}
