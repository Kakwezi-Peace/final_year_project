package com.carwash.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuestRegisterRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;
}
