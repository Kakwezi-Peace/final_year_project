package com.carwash.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI carWashOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("Car Wash Management System API")
                        .description("""
                                RESTful API for the Car Wash Management System (AUCA Final Project).
                                
                                Features:
                                - User Authentication (JWT)
                                - Customer & Vehicle Management
                                - Service Catalog Management
                                - Booking & Scheduling
                                - Payment Processing
                                - Employee Management
                                - Dashboard & Reports
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("AUCA Car Wash Project")
                                .email("admin@carwash.rw"))
                        .license(new License()
                                .name("MIT License")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter the JWT token in the format: Bearer <token>")));
    }
}
