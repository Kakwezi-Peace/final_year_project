package com.carwash.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, unique = true)
    private String licensePlate;

    @Column(nullable = false)
    private String make;     // e.g. Toyota

    @Column(nullable = false)
    private String model;    // e.g. Corolla

    @Column
    private Integer year;

    @Column
    private String color;

    @Column
    private String vehicleType; // Sedan, SUV, Truck, Motorcycle, etc.

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
