package com.carwash.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true)
    private String email;

    @Column
    private String phone;

    @Column
    private String position; // Washer, Supervisor, Receptionist, etc.

    @Column
    private String nationalId;

    @Column
    private LocalDateTime hireDate;

    @Column
    private boolean active = true;

    @Column
    private LocalDateTime statusChangedAt;

    /** Filled in when marking someone inactive – when they are expected to return */
    @Column
    private LocalDateTime expectedReturnDate;

    @OneToMany(mappedBy = "assignedEmployee", fetch = FetchType.LAZY)
    private List<Booking> assignedBookings;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
