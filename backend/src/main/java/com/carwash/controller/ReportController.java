package com.carwash.controller;

import com.carwash.dto.DashboardStats;
import com.carwash.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
@Tag(name = "Reports & Analytics", description = "Admin dashboard and reporting")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard statistics (totals, revenue, status counts)")
    public ResponseEntity<DashboardStats> getDashboard() {
        return ResponseEntity.ok(reportService.getDashboardStats());
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get revenue report for a date range")
    public ResponseEntity<Map<String, Object>> getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(reportService.getRevenueReport(start, end));
    }

    @GetMapping("/daily-peaks")
    @Operation(summary = "Get hourly booking distribution peaks for analytics")
    public ResponseEntity<java.util.Map<Integer, Long>> getDailyPeaks() {
        return ResponseEntity.ok(reportService.getDailyPeaks());
    }
}
