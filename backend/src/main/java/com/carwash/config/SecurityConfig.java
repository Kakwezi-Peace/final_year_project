package com.carwash.config;

import com.carwash.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ─── CSRF ────────────────────────────────────────────────────────────────
            // CSRF protection is disabled because this is a stateless REST API that
            // uses JWT tokens (not cookies/sessions). JWT carried in the Authorization
            // header is not vulnerable to CSRF attacks. Enabling CSRF here would break
            // all POST/PUT/DELETE calls from the SPA frontend.
            .csrf(AbstractHttpConfigurer::disable)

            // ─── CORS ────────────────────────────────────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ─── AUTHORIZATION RULES ──────────────────────────────────────────────────
            .authorizeHttpRequests(auth -> auth
                // Fully public – no token needed
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api-docs/**",
                    "/v3/api-docs/**",
                    "/actuator/health"
                ).permitAll()

                // Service catalog – read is public, write requires ADMIN or MANAGER
                .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")

                // ─── AUTHENTICATED SELF-SERVICE (TOP PRIORITY) ───────────────────
                .requestMatchers("/api/vehicles/my-vehicle").authenticated()
                .requestMatchers("/api/payments/my-payments").authenticated()
                .requestMatchers("/api/bookings/my-bookings").authenticated()

                // ─── ROLE-BASED RESTRICTIONS ─────────────────────────────────────
                // Service catalog – read is public
                .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/services/**").hasAnyRole("ADMIN", "MANAGER")

                // Vehicle management
                .requestMatchers("/api/vehicles/my-vehicle").authenticated()
                .requestMatchers("/api/vehicles/customer/**").hasAnyRole("ADMIN", "MANAGER", "STAFF", "CUSTOMER")
                .requestMatchers("/api/vehicles/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")

                // Reports – ADMIN, MANAGER, and STAFF (Read-Only)
                .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")

                // Admin management endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Employees – ADMIN/MANAGER can write, ADMIN+MANAGER+STAFF can read
                .requestMatchers(HttpMethod.GET, "/api/employees/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers(HttpMethod.POST, "/api/employees/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/employees/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/employees/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/employees/**").hasAnyRole("ADMIN", "MANAGER")

                // Payments - ADMIN/MANAGER/STAFF can read, STAFF can process
                .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                // Refund approval (PATCH) – only ADMIN/MANAGER
                .requestMatchers(HttpMethod.PATCH, "/api/payments/**").hasAnyRole("ADMIN", "MANAGER")
                // Refund request (POST /booking/*/request-refund) – any authenticated user
                .requestMatchers(HttpMethod.POST, "/api/payments/booking/*/request-refund").authenticated()
                // Other payment POSTs (e.g. process payment) – ADMIN/MANAGER/STAFF only
                .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/payments/**").hasAnyRole("ADMIN", "MANAGER")

                // All other endpoints – just need to be authenticated
                .anyRequest().authenticated()
            )

            // ─── STATELESS SESSION ───────────────────────────────────────────────────
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ─── AUTH PROVIDER & JWT FILTER ──────────────────────────────────────────
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS Configuration
     * Allows requests from the Lovable frontend (*.lovable.app) and local dev servers.
     * Only the listed HTTP methods and headers are permitted.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            "https://*.lovable.app",
            "https://*.lovable.dev"
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);   // preflight cache for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);   // strength 12 for production hardening
    }
}
