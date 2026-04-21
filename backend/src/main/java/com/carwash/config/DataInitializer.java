package com.carwash.config;

import com.carwash.model.*;
import com.carwash.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ServiceRepository serviceRepository;
    private final VehicleRepository vehicleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (bookingRepository.count() > 0) {
            log.info("Database already seeded. Skipping initialization.");
            return;
        }

        log.info("Seeding data for pagination testing...");

        // 1. Ensure a basic service exists
        Service washService = serviceRepository.findAll().stream().findFirst().orElseGet(() -> {
            Service s = new Service();
            s.setName("Diamond Wash");
            s.setCategory("EXPRESS");
            s.setPrice(new BigDecimal("5000"));
            s.setDurationMinutes(30);
            s.setActive(true);
            return serviceRepository.save(s);
        });

        // 2. Create a Mock Customer
        User user = new User();
        user.setUsername("customer_seed");
        user.setEmail("seed@example.com");
        user.setPassword(passwordEncoder.encode("password"));
        user.setRole(Role.CUSTOMER);
        user = userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(user);
        customer.setFirstName("Seed");
        customer.setLastName("Customer");
        customer.setPhone("0780000000");
        customer = customerRepository.save(customer);

        // 3. Seed 20 Bookings & Payments
        for (int i = 1; i <= 20; i++) {
            // Create a dedicated vehicle for each booking
            Vehicle vehicle = new Vehicle();
            vehicle.setLicensePlate("RAB " + (100 + i) + " X");
            vehicle.setMake("Toyota");
            vehicle.setModel("Land Cruiser");
            vehicle.setCustomer(customer);
            vehicle = vehicleRepository.save(vehicle);

            Booking booking = new Booking();
            booking.setCustomer(customer);
            booking.setService(washService);
            booking.setVehicle(vehicle);
            booking.setBookingReference("SEED-" + i + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            booking.setScheduledAt(LocalDateTime.now().minusDays(i % 5).plusHours(i));
            booking.setTotalAmount(washService.getPrice());
            
            // Alternating statuses
            if (i % 3 == 0) booking.setStatus(BookingStatus.COMPLETED);
            else if (i % 2 == 0) booking.setStatus(BookingStatus.CONFIRMED);
            else booking.setStatus(BookingStatus.PENDING);
            
            booking = bookingRepository.save(booking);

            // Create Payment for even numbers
            if (i % 2 == 0) {
                Payment payment = Payment.builder()
                        .booking(booking)
                        .amount(washService.getPrice())
                        .paymentMethod(PaymentMethod.MTN_MOMO)
                        .status(PaymentStatus.PAID)
                        .transactionReference("TXN-SEED-" + i)
                        .receiptNumber("RCT-SEED-" + i)
                        .paidAt(LocalDateTime.now())
                        .mobileMoneyNumber("0788123456")
                        .build();
                paymentRepository.save(payment);
            }
        }

        log.info("Successfully seeded 20 bookings and corresponding payments.");
    }
}
