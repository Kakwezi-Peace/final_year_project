package com.carwash.repository;

import com.carwash.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:input) OR LOWER(u.email) = LOWER(:input)")
    Optional<User> findByUsernameOrEmail(@org.springframework.data.repository.query.Param("input") String input);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
