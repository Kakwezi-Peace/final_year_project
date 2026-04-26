package com.carwash.service;

import com.carwash.model.Booking;
import com.carwash.model.User;
import com.carwash.repository.BookingRepository;
import com.carwash.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestCleanupService {

    private final UserRepository userRepository;
    private final CustomerService customerService;
    private final com.carwash.repository.CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    @Scheduled(cron = "0 0 0 * * ?") // Run daily at midnight
    @Transactional
    public void cleanupOldGuests() {
        log.info("Running scheduled cleanup for guest accounts...");
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        
        List<User> guests = userRepository.findAll().stream()
            .filter(User::isGuest)
            .toList();

        int deletedUsersCount = 0;
        for (User guest : guests) {
            if (guest.getCreatedAt() != null && guest.getCreatedAt().isBefore(sevenDaysAgo)) {
                try {
                    customerRepository.findByUserId(guest.getId()).ifPresent(customer -> {
                        customerService.deleteCustomer(customer.getId());
                    });
                    
                    userRepository.delete(guest);
                    deletedUsersCount++;
                    log.info("Deleted old guest user: {}", guest.getUsername());
                } catch (Exception e) {
                    log.error("Failed to delete guest user {}: {}", guest.getUsername(), e.getMessage());
                }
            }
        }

        List<Booking> oldGuestBookings = bookingRepository.findAll().stream()
            .filter(b -> b.isGuest() && b.getCreatedAt() != null && b.getCreatedAt().isBefore(sevenDaysAgo))
            .toList();
            
        int deletedBookingsCount = oldGuestBookings.size();
        for (Booking b : oldGuestBookings) {
            try {
                bookingRepository.delete(b);
                log.info("Deleted old guest booking: {}", b.getBookingReference());
            } catch (Exception e) {
                log.error("Failed to delete guest booking {}: {}", b.getBookingReference(), e.getMessage());
            }
        }

        log.info("Guest cleanup completed. Deleted {} guest accounts and {} guest bookings.", deletedUsersCount, deletedBookingsCount);
    }
}
