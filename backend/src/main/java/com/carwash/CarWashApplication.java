package com.carwash;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CarWashApplication {
    public static void main(String[] args) {
        SpringApplication.run(CarWashApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner initData(
            com.carwash.repository.UserRepository userRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByUsername("admin")) {
                com.carwash.model.User admin = com.carwash.model.User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@rubis.rw")
                        .fullName("System Administrator")
                        .role(com.carwash.model.Role.ADMIN)
                        .enabled(true)
                        .phone("0780000000")
                        .build();
                userRepository.save(admin);
                System.out.println("Default ADMIN account seeded: admin / admin123");
            }
        };
    }
}
